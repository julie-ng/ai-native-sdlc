# Identity — me vs. the agent

The agent is not me. It has its own GitHub user account and its own credentials, and its commits carry its own verified signature — never mine. This page is the overview; the decisions and their reasoning live in the ADRs it links to.

## Access and attribution are separate

Two questions, two mechanisms. *Can the agent push, read issues, open PRs?* That is **access**, and it is a token — a credential. *Whose name is on the commit?* That is **attribution**, and it is a GPG signature.

The GPG key is for **commit verification only**. It is not a security measure for authentication or authorization: it unlocks nothing, and leaking it means forged "Verified" commits, not access. It is a secret, but **not a credential**.

**There are no SSH keys anywhere in this setup.** SSH implies authentication, and nothing here authenticates over SSH — which is also why signing uses GPG rather than SSH signing ([ADR-001](./decisions/001-dev-container-agent-identity.md)).

## Two tiers, one principle

The agent runs in two places. On my laptop, in a [dev container](./dev-container.md): I prompt it, it repeats back what it will do, I confirm, and it runs unattended to the PR. In the cloud, as unsupervised pods in Kubernetes, started by an event with no human prompt. The identity principle is the same in both; what differs is how the agent gets access.

| | Dev container | Cloud |
|---|---|---|
| Decision | [ADR-001](./decisions/001-dev-container-agent-identity.md) | [ADR-012](./decisions/012-cloud-agent-identity.md) |
| Committer | agent user account `julieio-agent` | same account |
| Signing | GPG key on that account | same |
| Access | classic PAT, HTTPS for `git` and `gh` | GitHub App installation token from the [token broker](./token-broker.md), ≤ 1 hour, per pod |
| Scope | collaborator role + repo rulesets | downscoped per request to the pod's role and one repo |
| LLM | my subscription ([ADR-006](./decisions/006-models-and-llm-access.md)) | API keys via an AI gateway |
| Built in this repo | **yes** — signed commits show Verified, e.g. [PR #8](https://github.com/julie-ng/autonomous-agents-setup/pull/8) | **not yet** — no App registered, broker not built |

In the dev container the token is coarse on purpose. A classic PAT carries account-wide scopes and is not repo-scoped; the real boundary is the repository — collaborator role, rulesets and environment-only secrets, described in [GitHub configuration](./github-configuration.md). In the cloud, the broker narrows every token to exactly the pod's role and repository, and the App private key never leaves the broker.

## What the agent does not have

Just as important as what it holds. The agent has **no cloud identity** — workload identity belongs to platform services such as the workflow service and the token broker, not to agent pods ([ADR-003](./decisions/003-platform-services-vs-agent-pods.md)). It holds **no deploy credentials**, has **no Kubernetes API access**, and never sees the **App private key**.

Production secrets and deploys are meant to be reachable only after a human merges to `main`. There is one known gap — `workflow_dispatch` on `main` — covered in [GitHub configuration](./github-configuration.md#controls).

## How this came about

- The first design used one SSH key for clone, push and signing.
- But the agent also reads issues and opens PRs: `gh` → REST API → a token.
- With a token unavoidable, SSH became a second credential for one identity. Dropped everywhere.

## Decision log

| Date | Decision | Notes |
|---|---|---|
| 2026-10-21 | Cloud: agent user commits and signs, App token pushes | [ADR-012](./decisions/012-cloud-agent-identity.md) |
| 2026-10-21 | Repo configuration is the boundary, not the token | [GitHub configuration](./github-configuration.md) |
| 2026-10-20 | Dev container: own account, classic PAT, GPG signing, no SSH | [ADR-001](./decisions/001-dev-container-agent-identity.md) |
| 2026-10-10 | Agent pods get no cloud identity; token broker mints per-pod GitHub tokens | [ADR-003](./decisions/003-platform-services-vs-agent-pods.md), [token broker](./token-broker.md) |
| 2026-09-11 | PAT during the spike | Faster to set up, and `gh` cannot authenticate over SSH. |
| 2026-09-11 | Cloud: GitHub App, not SSH | A short-lived installation token beats a standing PAT in a disposable pod. |
| 2026-09-11 | Split identity into dev container and cloud tiers | Triggered by `gh` requiring a token — one mechanism could not serve both. |
| — | GitHub identity separate from mine | Own account. Attribution is the point. |
