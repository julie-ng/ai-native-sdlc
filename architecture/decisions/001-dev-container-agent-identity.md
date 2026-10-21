# ADR-001: Dev container agent identity — own account, classic PAT, GPG signing

- **Status:** Accepted
- **Date:** 2026-10-20 · updated 2026-10-21
- **Context:** **Dev containers** on my laptop, subscription-billed models. Cloud agents (K8s pods, API keys) are a separate decision, not covered here.
- **Supersedes:** the local-tier "ED25519 key + deploy key + SSH signing" plan in [identity.md](../identity.md#local-tier--bot-account--deploy-key)

## Context

**How the dev container agent runs:**

1. I kick it off with a first prompt — e.g. "read this handoff doc" or "pull work item XYZ".
2. The agent repeats back what it is supposed to do. I check that.
3. Once confirmed, it runs **unattended** through to opening the PR/MR.

The difference to the cloud tier: there, no human prompt starts the run.

| | Dev container (this ADR) | Cloud |
|---|---|---|
| Runs | on my laptop | K8s pod |
| Started by | my prompt + confirmed read-back | event, no human |
| Model auth | my Claude Code / Codex subscription, browser login via Zed | API keys |

**Why the identity looks like this:**

- Commits and PRs must be attributed to the agent, not me.
- Its work does not end at `git push`. Reading issues and opening PRs goes through `gh`, i.e. the GitHub REST API over HTTPS, which needs a token.
- An SSH key only covers git transport. Once a token is unavoidable, an SSH key on top means two credentials for one identity.
- Signing answers a different question (attribution: *who wrote this commit*) than authentication (*can it push*). Keep them on separate mechanisms.
- A separate user account is needed anyway for integrations: in testing, Vercel refused preview builds for commits by a user not in the Vercel team.

## Decision

| Concern | Mechanism |
|---|---|
| Identity | Dedicated GitHub user account `julieio-agent`, **collaborator** (write role) on the repos it works in |
| Authentication | **Classic PAT**, all scopes for the POC. `GH_TOKEN` + `gh auth setup-git`, HTTPS for both git and `gh` |
| Least privilege | **On the repository, not the token** — collaborator role + rulesets set by the repo admin (below) |
| Signing | **GPG** Ed25519 key, no passphrase, 1-year expiry (expires 2027-10-20) |
| Delivery | Generated outside the container; mounted read-only at runtime, imported into the container's GnuPG home. Never baked into an image or committed. |

**Rulesets, set by the admin:**

- No direct push to `main` for collaborators.
- Branch create / update / delete restricted to agent prefixes, e.g. `agent`, `codex`, `claude`.

Setup steps: [AGENTS.md → Git & GitHub Configuration](../../AGENTS.md#git--github-configuration).

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
| SSH signing instead of GPG | Semantically wrong signal. SSH reads as access/authentication; this key only verifies identity on commits and grants access to nothing. GPG is the plain, unambiguous fit. |
| Fine-grained PAT / per-repo tokens | Token churn for every repo in a dev container. Least privilege lives on the repo. |

## Consequences

**Positive**

- One credential for transport and API; `gh` and `git` share it.
- Attribution separate from access — the signing key grants no access to anything.
- Commits show **Verified** under the agent's account.
- Adding a repo = add the agent as a collaborator + apply rulesets. No new token.

**Accepted trade-offs**

| Trade-off | Notes |
|---|---|
| Classic PAT, all scopes | Reach = every repo the agent account is a collaborator on, at its role, limited by that repo's rulesets. Enforced server-side by GitHub. Account-level scopes act on the agent's own account. Keep the collaborator list minimal. |
| PAT includes the `workflow` scope | "Grants the ability to add and update GitHub Actions workflow files" ([GitHub docs](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)). The agent can change workflows on its own branches. **Unverified:** which secrets such a workflow run gets. "Restrict file paths" push rulesets could block `.github/workflows/**`, but the docs list push rulesets for private/internal repos only. |
| Signing key has no passphrase | Required for unattended signing. Read-only mount stops writes, not reads — anything in the container can copy it. Blast radius: forged "Verified" commits as the agent, no repo access. |
| Long-lived credentials in the container | PAT and signing key persist across sessions and are available during unattended runs. Accepted for a dev container on my laptop. |
| Key expiry | Rotate before 2027-10-20. Revocation certificate kept outside the container. |

## Open

- **Telling agent collaborators from human collaborators.** Prefix-restricted branches should bind agents, while a non-admin human collaborator can create any branch. Ruleset bypass lists take repo roles, teams, GitHub Apps ([GitHub docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository)) — both humans and the agent hold the write role, so role alone cannot separate them. A separate group (team) for one side is the likely mechanism. **Unverified:** teams exist only for organization-owned repos, not user-owned ones.

## Verification

- Commits `9f9a655` and `3c8d9fc`: signed by key `33BFA959316A465E`; GitHub API returns `verified: true`, `reason: valid`, author `julieio-agent` (checked 2026-10-20).
