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
- **Access and attribution are different things.** The token is a credential — it grants access. The signing key is a secret but **not a credential**: it authenticates and authorizes nothing, it only makes commits show as Verified. Keep them on separate mechanisms.
- A separate user account is needed anyway for integrations: in testing, Vercel refused preview builds for commits by a user not in the Vercel team.

## Decision

| Concern | Mechanism |
|---|---|
| Identity | Dedicated GitHub user account, **collaborator** (write role) on the repos it works in |
| Access | Token over HTTPS for both git and `gh` (`GH_TOKEN` + `gh auth setup-git`) |
| Least privilege | **On the repository, not the token** — collaborator role + rulesets set by the repo admin |
| Commit verification | **GPG** Ed25519 signing key, no passphrase, 1-year expiry |
| Delivery | Generated outside the container; mounted read-only at runtime, imported into the container's GnuPG home. Never baked into an image or committed. |

Setup steps: [AGENTS.md → Git & GitHub Configuration](../../AGENTS.md#git--github-configuration).

### Target design

- Agent-worked repos live in a **GitHub organization**.
- Agents are in their own **team**. Rulesets restrict that team to prefixed branches (e.g. `agent/`, `codex/`, `claude/`) for create / update / delete. Human collaborators, also non-admin, create any branch.
- Why an org: ruleset bypass lists take repo roles, teams and GitHub Apps ([GitHub docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository)). Humans and agents both hold the write role, so role alone cannot separate them; a team can. Teams require an organization.
- Token scope set: not yet defined.

### MVP / POC scope

What is actually built:

- Everything under my user account. **No org, no teams.**
- Agent account `julieio-agent`, collaborator with write role.
- **Classic PAT, all scopes.** Least privilege is on the repo, not the token.
- Rulesets: no direct push to `main` for collaborators; branch create / update / delete limited to agent prefixes, bypass for admin only. Without teams this binds **every** non-admin collaborator, human or agent — acceptable while I am the only human.

Key generation, run outside the container in a dedicated directory:

```sh
gpg --homedir "." \
  --batch --pinentry-mode loopback --passphrase '' \
  --quick-generate-key 'julieio-agent <agent-email>' \
  ed25519 sign 1y
```

### Secrets — environment only, never repository

The PAT includes the `workflow` scope on purpose — agents may write CI/CD. It "grants the ability to add and update GitHub Actions workflow files" ([scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)). So the agent can run any workflow on its own branches.

- **Repository secrets: none in agent-worked repos.** "Any user with write access to your repository has read access to all secrets configured in your repository" ([security hardening](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions)) — that includes the agent.
- **Environment secrets only**, behind protection rules. Jobs "can only access these secrets after any configured rules (for example, required reviewers) pass" ([environments](https://docs.github.com/actions/reference/environments)).
- Production's rule limits deployment branches to `main`. Agents cannot push to `main`, so a workflow on an agent branch never gets production secrets — only a human (or other actor with access) merging into `main` does.

> [!IMPORTANT]
> An environment **without** a protection rule gates nothing. Its secrets are available to any job that names it, from any branch.

> [!NOTE]
> Plan dependency: "Users with GitHub Free plans can only configure environments for public repositories." Private repos need Pro (user) or Team (org). "If you convert a repository from public to private, any configured protection rules or environment secrets will be ignored."

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
| Classic PAT, all scopes (MVP) | Reach = every repo the agent account is a collaborator on, at its role, limited by that repo's rulesets. Enforced server-side by GitHub. Account-level scopes act on the agent's own account. Keep the collaborator list minimal. |
| Signing key has no passphrase | Required for unattended signing. Read-only mount stops writes, not reads — anything in the container can copy it. Blast radius: forged Verified commits as the agent, no access to anything. |
| Long-lived secrets in the container | PAT (credential) and signing key (not a credential) persist across sessions and are available during unattended runs. Accepted for a dev container on my laptop. |
| Key expiry | Rotate before 2027-10-20. Revocation certificate kept outside the container. |

## Verification

- Commits `9f9a655` and `3c8d9fc`: signed by key `33BFA959316A465E`; GitHub API returns `verified: true`, `reason: valid`, author `julieio-agent` (checked 2026-10-20).
