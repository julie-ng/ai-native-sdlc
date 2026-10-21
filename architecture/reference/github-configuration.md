# GitHub configuration — no indirect path to credentials or production

Repository settings that stop an agent from reaching secrets or triggering a production deployment **indirectly**, through workflows it writes itself.

> [!NOTE]
> **Layer:** access control on GitHub resources, enforced server-side by GitHub. Not isolation of the agent's runtime — that is [Isolation levels](../01-use-case.md#isolation-levels). Applies to every agent identity, dev container ([ADR-001](../decisions/001-dev-container-agent-identity.md)) and cloud.

![GitHub configuration: agent branches cannot pass the Production main-only rule; repository secrets are empty](../../images/github-configuration.svg)

Numbers refer to [Controls](#controls), not ordered steps. Diagram style: [DESIGN.md](../../DESIGN.md). Write role does **not** mean access to production secrets: the agent can run its own workflows, but there is nothing for them to read. Repository secrets are empty, and the Production environment releases its secrets only to jobs running on `main`.

## The problem

- The agent is a collaborator with **write** role.
- Its token needs the `workflow` scope — agents author CI/CD. The scope "grants the ability to add and update GitHub Actions workflow files." [^scopes] Without it, a workflow file can only be committed if the same file "exists on another branch in the same repository." [^scopes]
- So the agent can push a workflow to its own branch and have it run. Two indirect paths follow:
  1. **Secrets** — a workflow reads secrets and leaks them.
  2. **Production** — a workflow deploys.

Branch protection alone does not close path 1. **Secret placement** does.

## Controls

| # | Setting | Closes |
|---|---|---|
| 1 | Agent account = collaborator, **write** role. Never maintain or admin. | Changing rulesets, environments, secrets |
| 2 | Ruleset on `main`: **Restrict updates**. Bypass: admin only. A merge is an update, so the agent can neither push nor merge. "Require a pull request" alone is not enough — the PR "doesn't necessarily have to be approved, but it must be opened." [^available-rules] | Agent code reaching `main` without a human merge |
| 3 | Ruleset on branches: create / update / delete only for agent prefixes, e.g. `agent/`, `codex/`, `claude/`. Bypass: admin only. | Agent touching other people's branches |
| 4 | **No repository secrets.** | Path 1 — "Any user with write access to your repository has read access to all secrets configured in your repository." [^hardening] |
| 5 | **Environment secrets only**, and every environment holding secrets has a **protection rule** — deployment branches limited to `main`. | Path 1 — jobs "can only access these secrets after any configured rules (for example, required reviewers) pass." [^environments] |
| 6 | Production deploys run only through the protected environment. | Path 2 — an agent branch cannot satisfy the `main`-only rule, and agents cannot push to `main` (2). |
| 7 | Third-party deploy integrations build only for team members. | Path 2 outside Actions. Observed in testing: Vercel refused preview builds for commits by a user not in the Vercel team. |

**Net effect:** production secrets and production deploys are reachable only after a human (or another actor with access to `main`) merges.

> [!IMPORTANT]
> **`workflow_dispatch` on `main` reaches production.** Write role includes dispatch; via API it needs only the `repo` scope. [^dispatch] A dispatch on `main` satisfies the `main`-only rule (5), so the net effect above does not hold for deploy workflows with a dispatch trigger. Confirmed 2026-10-21.
>
> No role-level switch to remove dispatch was found on any plan. [^custom-roles] POC mitigation: required reviewers on Production — on Pro, public repos only. [^deployments]

## Pitfalls

- **Environment without a protection rule gates nothing.** "Secrets stored in an environment are only available to workflow jobs that reference the environment" — and without a deployment-branch rule there is "no restriction on which branch or tag can deploy to the environment." [^deployments] Any job on any branch can reference it. Keep secret-free environments secret-free.
- **Write role in a bypass list.** Bypass actors can include "the maintain or write role." [^rulesets] The agent holds write — adding that role to a bypass list exempts the agent.
- **Privileged triggers.** `pull_request_target` and `workflow_run` "are privileged, which means they share the same cache of the main branch with other privileged workflow triggers, and may have repository write access and access to referenced secrets." [^hardening] They run the workflow from the base branch, but must not check out and execute agent-authored code.
- **The fork rule does not help here.** Secrets "are not passed to workflows that are triggered by a pull request from a fork." [^ui] Agents push branches to the same repo, not from a fork.
- **Public → private.** "If you convert a repository from public to private, any configured protection rules or environment secrets will be ignored." [^environments]
- **Plan.** "Users with GitHub Free plans can only configure environments for public repositories." [^environments] Private repos need Pro (user) or Team (org).

## Target design vs. MVP

| | Target design | MVP / POC |
|---|---|---|
| Owner | GitHub organization | the developer's personal account |
| Plan | GitHub Enterprise | GitHub Pro |
| Agent / human split | agents in their own **team**; rulesets (3) apply to that team, human collaborators create any branch | no teams; rulesets (3) bind **every** non-admin collaborator — fine while the developer is the only human |
| Why | Bypass lists take repo roles, teams, GitHub Apps [^rulesets]. Humans and agents both hold write, so role alone cannot separate them. Teams require an organization. | — |

## Unverified

- **`GITHUB_TOKEN` in agent-branch workflows** — what default permissions it gets, and whether rulesets bind pushes made with it. Check the repo's workflow-permissions setting before relying on (2).

## Decision log

| Date | Decision | Notes |
|---|---|---|
| 2026-10-21 | Least privilege on the repo, not the token | Role + rulesets + secret placement. The token is a classic PAT; granularity lives in the repo. [ADR-001](../decisions/001-dev-container-agent-identity.md) |
| 2026-10-21 | Environment secrets only | Repo secrets are readable by every write collaborator, agents included. |
| 2026-10-21 | Production tied to `main` via environment protection rule | Agents cannot push to `main`, so cannot satisfy the rule. |
| 2026-10-21 | `workflow` scope required | Agents author CI/CD; adding or updating workflow files needs the scope. Safe because of the two decisions above. [ADR-001](../decisions/001-dev-container-agent-identity.md) |

## Sources

Primary — GitHub docs, checked 2026-10-21:

[^scopes]: [Scopes for OAuth apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps) — `workflow`, `repo`
[^hardening]: [Security hardening for GitHub Actions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions)
[^environments]: [Environments reference](https://docs.github.com/actions/reference/environments)
[^deployments]: [Deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments) — deployment protection rules, deployment branches and tags
[^dispatch]: [REST API: workflows](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event) — create a workflow dispatch event
[^custom-roles]: [About custom repository roles](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/about-custom-repository-roles)
[^rulesets]: [Creating rulesets for a repository](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository) — bypass actors
[^available-rules]: [Available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets) — restrict creations / updates / deletions, require a pull request, file path restrictions (push rulesets: private/internal repos only)
[^ui]: GitHub UI, repo **Settings → Secrets and variables → Actions**, observed 2026-10-21

Also consulted:

- [Using secrets in GitHub Actions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions) — forks, Dependabot

Observed in a working repo, 2026-10-21 (screenshots of its settings): three environments, only Production has a protection rule and holds secrets; no repository secrets.
