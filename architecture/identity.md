# Identity — me vs. the agent

The agent is not me. Own GitHub identity, own credentials — never mine.

![Identity Separation](./../images/identity-separation.svg)

Two things kept apart:

- **Access** — can it push, read issues, open PRs? A token. A credential.
- **Attribution** — whose name is on the commit? A GPG signing key. A secret, but **not** a credential — it grants access to nothing.

Decisions: [ADR-001](./decisions/001-dev-container-agent-identity.md) (dev container), [ADR-012](./decisions/012-cloud-agent-identity.md) (cloud). Repo-side controls: [GitHub configuration](./github-configuration.md).

## Why this changed — the agent needs the API, not just git

**This is the origin of the whole shift.** The earlier model was "one ED25519 key does clone, push and signing — no `GITHUB_TOKEN` needed." That held only as long as the agent's work ended at a pushed branch.

It does not. Reading issues and opening PRs means the GitHub REST API, which `gh` fronts — and the API takes a token. SSH gets you git transport and nothing more.

Once a token is unavoidable, keeping an SSH key *as well* means two credentials for one identity. So SSH is gone from both tiers: a token for access, GPG for signing. In the cloud, a long-lived PAT in a disposable pod is the worst option, which is what pointed at a GitHub App and short-lived, downscoped installation tokens.

## Two tiers, two mechanisms

Split by **where the agent runs** — laptop vs. cloud, subscription vs. API keys. Not by whether a human watches: the dev container agent also runs unattended once I've confirmed its read-back of the task.

| | **Dev container** ([ADR-001](./decisions/001-dev-container-agent-identity.md)) | **Cloud — unsupervised** ([ADR-012](./decisions/012-cloud-agent-identity.md)) |
|---|---|---|
| Where | dev container on my laptop | K8s pod per agent step |
| Started by | my prompt + confirmed read-back, then unattended | event, no human |
| Committer | agent user account `julieio-agent` | same user account |
| Signing | GPG key on that account → Verified | same |
| Access | classic PAT, HTTPS for git and `gh` | GitHub App installation token from the [token broker](./token-broker.md), ≤ 1 hour |
| Scope | collaborator role + repo rulesets | downscoped per request to role + one repo |

## Current status

> [!IMPORTANT]
> **What is actually built in this repo, as of 2026-10-21.**
>
> | | State |
> |---|---|
> | Agent GitHub account (`julieio-agent`) | **exists**, collaborator on its repos |
> | Dev container: branch → signed commits → PR as the agent | **working**, classic PAT — e.g. [PR #8](https://github.com/julie-ng/autonomous-agents-setup/pull/8) |
> | Commit signing | **working** — GPG, commits show Verified ([ADR-001](./decisions/001-dev-container-agent-identity.md#verification)) |
> | GitHub App | **not registered** |
> | Token broker, anything in K8s | **not built** in this repo |

### What the PAT actually scopes

A classic PAT (`ghp_`) carries account-wide scopes. It does **not** scope to a repository.

> [!IMPORTANT]
> The boundary is **GitHub's repo permissions on the agent account** — collaborator role plus rulesets — not the token. Do not describe the PAT as repo-scoped. See [GitHub configuration](./github-configuration.md).

## Workload identity — platform services only

Workload identity is for **platform services** — workflow service, artifact service, token broker, Argo — to reach PostgreSQL, Blob Storage and Key Vault. **Agent pods get none.** Their GitHub access is a short-lived broker token; their access to platform services is an HMAC token ([ADR-003](./decisions/003-platform-services-vs-agent-pods.md)).

## Dev container tier

For runs on my laptop: I prompt, the agent reads back, I confirm, it runs unattended to the PR.

- Dedicated GitHub user account, collaborator with write role.
- Classic PAT over HTTPS, used by both `git` and `gh` (`GH_TOKEN` + `gh auth setup-git`).
- GPG Ed25519 signing key, no passphrase, 1-year expiry. Generated outside the container, mounted read-only, imported at runtime.
- Repo-local git config only (`--local`), so it cannot leak into my other repos.

Setup steps: [AGENTS.md → Git & GitHub Configuration](../AGENTS.md#git--github-configuration). Full reasoning: [ADR-001](./decisions/001-dev-container-agent-identity.md).

> [!NOTE]
> No passphrase is a deliberate choice for **unattended** signing, not a default. For a key I trigger myself, a real passphrase is the better trade.

## Cloud tier — user commits, App token pushes

For a pod with no human and no standing session. **Design, not yet built in this repo.**

- Commits are made with plain `git commit` by the agent **user account** and GPG-signed — same as the dev container. Signing happens at commit time; the token only authenticates the push.
- Push and forge API calls use a **GitHub App installation token**, minted per pod by the [token broker](./token-broker.md), downscoped to the pod's role and one repository.
- The App private key lives **only in the broker**, read from Key Vault via the broker's workload identity. It never enters an agent pod.

The broker's flow, per pod:

1. Sign a JWT with the App's private key — RS256, `iss` = App ID, `exp` ≤ 10 min
2. `POST /app/installations/<id>/access_tokens` with `repositories` and `permissions` for this pod → installation token (`ghs_…`), **1-hour expiry**
3. Pod uses it as an HTTPS credential: `https://x-access-token:<token>@github.com/…`, and for `gh`

Permissions per role — the App needs the union:

| Role | Permissions |
|---|---|
| planner | issues: write, contents: read |
| coder | contents: write |
| reviewer | contents: read, pull requests: write |
| open-PR step | pull requests: write |

> [!NOTE]
> GitHub issues the key in **PKCS#1**; some JWT libraries (Node's `jsonwebtoken`) want PKCS#8. Convert with `openssl pkcs8 -topk8 -nocrypt`. Verify a key matches GitHub's record by comparing `openssl rsa -pubout | sha256 | base64` against the fingerprint on the App's settings page.

> [!NOTE]
> Use Octokit (`@octokit/auth-app`) or PyGithub rather than hand-rolling JWT signing, unless debugging inside a container that lacks them.

### Open questions

- **Inbound webhook secret vs. outbound private key.** The triggering webhook goes to the workflow service; the App private key sits in the broker. Two different secrets for two different directions. Do not conflate them.
- More in [ADR-012 → Open](./decisions/012-cloud-agent-identity.md#open).

## Scope — what the agent writes

- **GitHub:** its own prefixed branches; issues and PR reviews where its role allows.
- **Platform services:** artifacts and step status, in-cluster.
- No deploy credentials. No cloud keys. No package-registry tokens.
- Downstream runs off **GitHub** — CI, deploys, checks — reacting to merges, not driven by the agent.

> [!IMPORTANT]
> Blast radius. A compromised or hallucinating agent can produce branches, comments and artifacts — reviewable and revertible. What keeps it from production and secrets is the repo configuration, not the token: [GitHub configuration](./github-configuration.md), including its known `workflow_dispatch` gap.

## LLM auth

Same split. Details: [ADR-006](./decisions/006-models-and-llm-access.md).

| | Dev container | Cloud |
|---|---|---|
| **Mechanism** | Claude Code / Codex, browser login via Zed | API key via an AI gateway |
| **Binding** | My subscription | Agent's own credential |
| **Model** | Claude or OpenAI | Model-agnostic, chosen per step |

> [!NOTE]
> The agent has its own GitHub identity in both cases. Only the *LLM* credential differs.

## Decision log

| Date | Decision | Notes |
|---|---|---|
| — | GitHub identity separate from mine | Own account. Attribution is the point. |
| — | LLM auth (dev container) | My subscription. |
| — | LLM auth (cloud) | API keys, vendor-agnostic. |
| 2026-09-11 | Split identity into local and cloud tiers | **Triggered by `gh` requiring a token.** Once a token was unavoidable, one mechanism could not serve both. |
| 2026-09-11 | Cloud tier: GitHub App, not SSH | A 1-hour installation token beats a standing PAT in a disposable pod. |
| 2026-09-11 | ~~Local tier: bot account + deploy key~~ | **Superseded 2026-10-20** by ADR-001. |
| 2026-09-11 | PAT during the spike | Faster to set up, and `gh` cannot auth over SSH. |
| 2026-09-11 | ~~Commit signing deferred~~ | **Superseded 2026-10-20** — GPG signing working. |
| 2026-09-11 | ~~Workload identity as endpoint for agents~~ | **Superseded 2026-10-10** — workload identity for platform services only. |
| 2026-10-10 | Token broker mints per-pod tokens | Private key only in the broker. [token-broker.md](./token-broker.md). |
| 2026-10-20 | Dev container: classic PAT + GPG, no SSH, no deploy key | [ADR-001](./decisions/001-dev-container-agent-identity.md). |
| 2026-10-21 | Cloud: agent user commits and signs, App token pushes | Not "the App is the identity" — a bot cannot hold a GPG key and API-created commits are ruled out. [ADR-012](./decisions/012-cloud-agent-identity.md). |

### Accepted Trade-Offs

| Tradeoff | Notes |
|---|---|
| Dev container agent borrows my LLM subscription | GitHub identity is separate either way. |
| Dev container holds long-lived secrets | PAT and signing key, no passphrase, for unattended runs. Boundary is repo configuration. |
| Cloud keeps one long-lived access secret | The App's private key — only in the broker. Pods hold a ≤ 1-hour token. |
| Signing key in committing pods | Secret, not a credential. Blast radius: forged Verified commits as the agent. |
