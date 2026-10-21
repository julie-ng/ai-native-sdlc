# ADR-012: Cloud agent identity — agent user commits, GitHub App token pushes

- **Status:** Accepted — **design only. Not implemented, not verified.**
- **Date:** 2026-10-21
- **Context:** Cloud tier (Level 2, K8s pods), no human starts the run. Dev container identity is [ADR-001](./001-dev-container-agent-identity.md).

> [!IMPORTANT]
> Nothing in this ADR has been built or tested. No GitHub App is registered. Claims marked **Unverified** must be checked before implementation.

## Context

- Same principle as ADR-001: the agent has its own identity, never commits as me.
- Pods are disposable and run untrusted code; a standing, account-wide PAT is the wrong fit.
- Each step should get a token scoped to its role and **one** repository.
- Commits must show **Verified** — unverified commits are not acceptable.
- Commits are made with plain `git commit` ([ADR-008](./008-scm-agnostic-native-git.md)), not via the API.

## Decision

| Concern | Mechanism |
|---|---|
| Committer | Agent **user account** (`julieio-agent`), same as ADR-001 |
| Commit verification | **GPG** signing key of that user account, signed at `git commit` |
| Access — push + forge API | **GitHub App installation token**, minted per pod by the [token broker](../token-broker.md), ≤ 1 hour |
| Token scope | Downscoped per request to the pod's role and one repository |
| App private key | Only in the broker, read from Key Vault via the broker's workload identity. Never in an agent pod. |

**Why a GitHub App:** only the installation-token endpoint takes `repositories` and `permissions` per request ([GitHub docs](https://docs.github.com/en/rest/apps/apps#create-an-installation-access-token-for-an-app)). That is what lets the broker narrow each token to role + repo. One token covers git over HTTPS (`x-access-token`) and the API ([GitHub docs](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation)). Tokens expire after one hour.

**Why a user account still commits:** the App's `…[bot]` identity cannot hold a GPG key (**unverified**), and API-created commits are ruled out by ADR-008. A separate user account is needed for integrations anyway (Vercel preview builds, see ADR-001).

**Signing and access are independent mechanisms.** The signature is made locally at `git commit`; the App token only authenticates the HTTPS push and API calls. Which token pushes has no bearing on the signature.

**The signing key is a secret, not a credential.** It grants access to nothing; it only marks commits Verified. Its presence in the pod does not contradict "no credentials in agent pods".

| Role | Token permissions |
|---|---|
| planner | issues: write, contents: read |
| coder | contents: write |
| reviewer | contents: read, pull requests: write |
| open-PR step | pull requests: write |

The App needs the union of these.

**GitLab:** Project Access Tokens. No equivalent to per-request downscoping; the gain is "not a human's personal token".

### Target design

As above.

### MVP / POC scope

Not built. Today's cloud-tier evidence is a `docker run` spike with a classic PAT ([goose-k8s-prep](../../spikes/goose-k8s-prep/)).

## Alternatives considered

| Option | Why not |
|---|---|
| Classic PAT in pods (as ADR-001) | Long-lived, account-wide credential in a disposable pod running untrusted code. |
| Fine-grained PAT | Scope fixed at creation; no per-request downscoping. |
| Deploy key | One repo, but no permission granularity and no API access. |
| App commits via API (auto-signed) | Forge-specific commit path; ruled out by ADR-008. |
| App private key mounted in the pod | Key can mint for every installed repo with all permissions. Lives only in the broker. |
| Codex / claude.ai GitHub connectors | OAuth as me — commits attributed to me. |
| Cloud vault per-run secrets | Needs per-pod cloud identity; vaults not built for per-run churn. See token-broker.md. |

## Consequences

**Positive**

- No standing access credential in any agent pod.
- Per-step, per-repo, per-role token.
- Commits Verified under the agent's user account.

**Accepted trade-offs**

| Trade-off | Notes |
|---|---|
| Two GitHub identities | Commits show the user; pushes, PRs, comments show the App bot. |
| Signing key in every committing pod | Secret, not a credential. Blast radius: forged Verified commits as the agent. |
| App private key is the crown jewel | Mints for every installed repo. Exactly one place: the broker. |
| Broker is a hard dependency | If it is down, no agent starts. |

## Open

- **Signing key delivery** into pods — not designed.
- **Unverified:** GitHub App bots cannot register GPG keys.
- **App name vs. owner.** "You cannot use the same name as an existing GitHub account, unless it is your own user or organization name" ([GitHub docs](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app)). An App named `julieio-agent` must be registered **by the `julieio-agent` account itself**. Undecided: the agent account owns the App, or my account owns it under a different name.
- [identity.md](../identity.md) lists App permissions without **Issues**; the planner needs it.
- Broker availability: replicas + readiness, or mint in the workflow service before the pod starts.
- Projected token `expirationSeconds` (min 600) vs. longest step.
