# ADR-001: Dev container agent identity — own account, classic PAT, GPG signing

- **Status:** Accepted
- **Date:** 2026-10-20 · updated 2026-10-21
- **Context:** **Dev containers** on the human developer's laptop, subscription-billed models. Cloud agents (K8s pods, API keys) are a separate decision, not covered here.
- **Supersedes:** the local-tier "ED25519 key + deploy key + SSH signing" plan in [identity.md](../identity.md#local-tier--bot-account--deploy-key)

## Context

**How the dev container agent runs:**

1. The human developer kicks it off with a first prompt — e.g. "read this handoff doc" or "pull work item XYZ".
2. The agent repeats back what it is supposed to do. The developer checks that.
3. Once confirmed, it runs **unattended** through to opening the PR/MR.

The difference to the cloud tier: there, no human prompt starts the run.

| | Dev container (this ADR) | Cloud |
|---|---|---|
| Runs | on the developer's laptop | K8s pod |
| Started by | developer's prompt + confirmed read-back | event, no human |
| Model auth | developer's Claude Code / Codex subscription, browser login via Zed | API keys |

**Why the identity looks like this:**

- Commits and PRs must be attributed to the agent, not the developer.
- Its work does not end at `git push`. Reading issues and opening PRs goes through `gh`, i.e. the GitHub REST API over HTTPS, which needs a token.
- An SSH key only covers git transport. Once a token is unavoidable, an SSH key on top means two credentials for one identity.
- **Access and attribution are different things.** The token is a credential — it grants access. The signing key is a secret but **not a credential**: it authenticates and authorizes nothing, it only makes commits show as Verified. Keep them on separate mechanisms.
- A separate user account is needed anyway for integrations: in testing, Vercel refused preview builds for commits by a user not in the Vercel team.

## Decision

| Concern | Mechanism |
|---|---|
| Identity | Dedicated GitHub user account, **collaborator** (write role) on the repos it works in |
| Access | Token over HTTPS for both git and `gh` (`GH_TOKEN` + `gh auth setup-git`) |
| Least privilege | **On the repository, not the token** — see [GitHub configuration](../github-configuration.md) |
| Commit verification | **GPG** Ed25519 signing key, no passphrase, 1-year expiry |
| Delivery | Generated outside the container; mounted read-only at runtime, imported into the container's GnuPG home. Never baked into an image or committed. |

Setup steps: [AGENTS.md → Git & GitHub Configuration](../../AGENTS.md#git--github-configuration).

### Target design

- Agent-worked repos live in a **GitHub organization**, agents in their own **team**, so rulesets can bind agents without binding human collaborators.
- Token scope set: not yet defined.

### MVP / POC scope

- Everything under the developer's personal account. **No org, no teams.**
- Agent account `julieio-agent`, collaborator with write role.
- **Classic PAT**, including the `workflow` scope on purpose — agents author CI/CD, and adding or updating workflow files requires that scope. Granularity is not in the token but in the repository configuration.

Repo-side configuration — rulesets, environment-only secrets, production tied to `main` — is in [GitHub configuration](../github-configuration.md). It is what makes a coarse classic PAT acceptable.

Key generation, run outside the container in a dedicated directory:

```sh
gpg --homedir "." \
  --batch --pinentry-mode loopback --passphrase '' \
  --quick-generate-key 'julieio-agent <agent-email>' \
  ed25519 sign 1y
```

## Alternatives considered

| Option | Why not |
|---|---|
| SSH key for transport + signing | Does not cover `gh` / the API. |
| SSH key + PAT | Two credentials for one identity. |
| SSH signing instead of GPG | Semantically wrong signal. An SSH key reads as authentication; this key only marks commits Verified and grants access to nothing. GPG is the plain, unambiguous fit. |
| Fine-grained PAT / per-repo tokens | Token churn for every repo in a dev container. Least privilege lives on the repo. |

## Consequences

**Positive**

- One credential for transport and API; `gh` and `git` share it.
- Attribution separate from access — the signing key grants access to nothing.
- Commits show **Verified** under the agent's account.
- Adding a repo = add the agent as a collaborator + apply rulesets. No new token.

**Accepted trade-offs**

| Trade-off | Notes |
|---|---|
| Classic PAT (MVP) | Granularity is in the repository configuration, not the token. Reach = every repo the agent account is a collaborator on, at its role, limited by that repo's rulesets. Enforced server-side by GitHub. Account-level scopes act on the agent's own account. Keep the collaborator list minimal. |
| Signing key has no passphrase | Required for unattended signing. Read-only mount stops writes, not reads — anything in the container can copy it. Blast radius: forged Verified commits as the agent, no access to anything. |
| Long-lived secrets in the container | PAT (credential) and signing key (not a credential) persist across sessions and are available during unattended runs. Accepted for a dev container on the developer's laptop. |
| Key expiry | Rotate before 2027-10-20. Revocation certificate kept outside the container. |

> [!IMPORTANT]
> **POC gap:** with write role and `repo` scope, the agent can dispatch a deploy workflow on `main` and reach production without a new human merge (confirmed 2026-10-21). No GitHub plan was found to offer a role-level switch that removes dispatch. POC mitigation: required reviewers on Production. See [GitHub configuration](../github-configuration.md#controls).

## Verification

- Commits `9f9a655` and `3c8d9fc`: signed by key `33BFA959316A465E`; GitHub API returns `verified: true`, `reason: valid`, author `julieio-agent` (checked 2026-10-20).
