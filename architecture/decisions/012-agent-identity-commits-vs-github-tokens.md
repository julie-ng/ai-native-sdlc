# ADR-012: Agent identity — commits vs. GitHub tokens

- **Status:** Accepted — **design. Not yet implemented or verified in this repo.**
- **Date:** 2026-10-21
- **Context:** Cloud tier (Level 2, K8s pods), no human starts the run. Dev container identity is [ADR-001](./001-dev-container-agent-identity.md).

> [!IMPORTANT]
> Not everything in this ADR has been built or tested in this repo. No GitHub App is registered for this project yet. Claims marked **Unverified** must be checked before implementation.

## Context

- Same principle as ADR-001: the agent has its own identity, never commits as the human developer.
- Pods are disposable and run untrusted code. Each step needs short-lived GitHub access issued on demand, rather than a standing credential shared across runs.
- That access must also be scoped to the step's role and **one** repository. Expiration alone is insufficient.
- Commits must show **Verified** — unverified commits are not acceptable.
- Commits are made with plain `git commit` ([ADR-008](./008-scm-agnostic-cli-over-mcp.md)), not via the API.

## Decision

> [!IMPORTANT]
> **Decisive requirement: short-lived GitHub credentials issued on demand for each agent step, scoped to its repository and role.** The broker obtains installation tokens for the assigned step; the platform does not distribute a standing access token across runs. Keeping the long-lived App private key in one trusted issuer is the accepted cost of this lifecycle.

| Concern | Mechanism |
|---|---|
| Committer | Agent **user account** (`julieio-agent`), same as ADR-001 |
| Commit verification | **GPG** signing key of that user account, signed at `git commit` |
| Access — push + forge API | **GitHub App installation token**, minted per pod by the [token broker](../reference/token-broker.md), ≤ 1 hour |
| Token scope | Downscoped per request to the pod's role and one repository |
| App private key | Only in the broker, read from Key Vault via the broker's workload identity. Never in an agent pod. |

**Why a GitHub App + broker:** the installation-token API supports on-demand issuance with repository and permission restrictions. The broker derives those restrictions from the validated pod's assignment and keeps the App private key out of agent pods. Tokens expire after one hour ([issuance and scope](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)). They work for native Git over HTTPS and the forge API ([installation authentication](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation)).

**Per-step issuance is platform policy, not single-use or run-bound enforcement by GitHub.** Installation tokens remain reusable within their granted repository/permissions until expiry or revocation. Deleting the pod does not automatically revoke its issued GitHub token. The broker avoids intentionally sharing credentials across runs; it does not make a stolen token unusable elsewhere during its lifetime.

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

The requirement combines on-demand short-lived issuance, per-step repository/role scoping, and trusted custody of the issuer key. [PATs can expire](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens); expiry alone is not why they lose this comparison. [Deploy keys have no expiry date](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys#cons-of-deploy-keys).

| Option | Why not |
|---|---|
| Classic PAT in pods (as ADR-001) | Supports Git + API and configurable expiration, but distributes a standing user credential instead of using the per-step issuance exchange. |
| Fine-grained PAT | Supports repository/permission scoping and configurable expiration, but scope is configured at creation; no per-request installation-token exchange for step-specific access. |
| Deploy key | One-repository Git access, but no expiry date or forge API access; does not meet the short-lived Git + API requirement. |
| App commits via API (auto-signed) | Forge-specific commit path; ruled out by ADR-008. |
| App private key mounted in the pod | Can mint short-lived tokens, but exposes long-lived issuance authority to untrusted code. Keeping that authority in the broker is part of the requirement. |
| Codex / claude.ai GitHub connectors | OAuth as the developer — commits attributed to them. |
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
| Long-lived App private key and broker operations | Accepted to obtain short-lived, per-step GitHub access without giving agents the issuer key. The key can mint for installed repos within App permissions; its custody and rotation remain platform responsibilities. |
| Broker is a hard dependency | If it is down, no agent starts. |

## Decision log

| Date | Clarification | Reasoning |
|---|---|---|
| 2026-10-24 | Highlight short-lived per-step issuance and distinguish it from single-use/run binding | This lifecycle justifies managing the long-lived App key in a trusted broker; configurable PAT expiry alone does not supply the chosen issuance/scoping exchange. |
| 2026-10-24 | Rename ADR to commits vs. GitHub tokens | Makes the separation between attribution/signing and access credentials discoverable by filename. |

## Open

- **Signing key delivery** into pods — not designed.
- **Unverified:** GitHub App bots cannot register GPG keys.
- **App name vs. owner.** "You cannot use the same name as an existing GitHub account, unless it is your own user or organization name" ([GitHub docs](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app)). An App named `julieio-agent` must be registered **by the `julieio-agent` account itself**. Undecided: the agent account owns the App, or the developer's account owns it under a different name.
- [identity.md](../reference/identity.md) lists App permissions without **Issues**; the planner needs it.
- Broker availability: replicas + readiness, or mint in the workflow service before the pod starts.
- Projected token `expirationSeconds` (min 600) vs. longest step.
