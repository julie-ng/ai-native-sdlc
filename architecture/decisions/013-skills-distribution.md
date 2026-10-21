# ADR-013: Skills distribution — baked for the POC, target left to the platform

- **Status:** Accepted
- **Date:** 2026-10-21 (POC choice 2026-10-19)
- **Context:** Cloud agent pods — how each agent role gets its skill set. Analysis originally in [stale/skills-distribution-and-governance.stale.md](../../stale/skills-distribution-and-governance.stale.md).

## Context

goose has **no governance layer for skills**:

| | Scoping | Where |
|:--|:--|:--|
| Extensions (tools) | per-recipe `extensions:`, plus an Extension Allowlist | config |
| Skills | **none** | filesystem discovery only |

- No allowlist, no `skills:` recipe field, no `GOOSE_SKILLS_PATH` (verified against goose docs, 2026-09-09).
- goose discovers `.agents/skills/` (project), `~/.agents/skills/` (global), and `.claude/skills/` for backward compatibility ([ADR-011](./011-skills-location.md)).
- So the skill set is a property of the **filesystem**, not of the recipe. Different agent roles cannot be expressed as different recipes if they need different skills.

Why it matters:

- **A skill can derail an unattended run.** In the [goose-container](../../spikes/goose-container/) spike, superpowers' `brainstorming` (*"You MUST use this before any creative work"*) auto-loaded and ended two headless runs on an unanswered confirmation prompt — exit 0, no output, no error.
- **A cloned repo extends the agent.** Project-level skills merge with the global set, so a repo carrying `.agents/skills/` contributes skills to the run.
- **Motivation, stated honestly:** today it is tidiness — a reviewer does not need deployment skills, and confirm-first skills break headless runs. Long-term it is security. The cheap option is adequate for the first and not for the second.

## Decision

### Target design

**Deliberately not prescribed.** The mechanism is left to the architect of the platform the agents run on — reuse an existing distribution mechanism if the platform has one. This ADR records the options and the constraints any choice must meet, not a recommendation.

Constraints for any option:

- **The agent must not be able to influence its own pod spec or identity** — no RBAC to create Jobs, patch pod specs or bind ServiceAccounts. If it can, every option below collapses.
- **Presence is not loading.** Every option controls which skills are *available*. The model still loads whatever it finds, from descriptions. "We scope skills per agent" does not mean "we control skill loading".

### MVP / POC scope

**Bake skills into the image, one image per role** — option A below. Role images inherit from a shared base and differ only in which skills are copied in ([ADR-010](./010-agent-images.md)). Confirm-first skills are not shipped in images for unattended runs.

Not a recommendation for other platforms; it is the simplest option that is reproducible and has no runtime dependency.

## Alternatives considered

| Option | Mechanism | Identity check | Depends on GitHub at pod start |
|:--|:--|:--|:--|
| **A** — bake per role | `npx skills add` at build time, one image per role | n/a — fixed at build | no |
| **B** — platform mounts | sync job copies skills to Blob; pods mount a subdirectory read-only | none — confused deputy | no |
| **C** — pod pulls from GitHub | init container fetches under the pod's own workload identity, federated to GitHub | pod's own | **yes** |
| **C′** — pod pulls from Blob | same, against per-prefix authorization on blob storage | pod's own | no |

**A — bake per role.** Reproducible: the skill set is an image property, pinned with everything else. Cost: rebuild to change skills, N images to maintain — mitigated by a shared base.

**B — not a boundary.** The agent needs no storage credentials because the *platform* holds them and mounts whatever the manifest names. B only holds if the agent cannot influence the manifest, which is not safe to assume: agents write code, open PRs and may touch infra repos. Paths in include editing a GitOps-managed manifest or influencing the templates that produce the pod spec. Mount selection is a *request*, not an *authorization*.

**C and C′ — credential and constraint travel together.** The manifest can name anything; the fetch still fails if the pod's identity is not authorized. The real choice between them is not security: C buys freshness and one less system to run, at the price of a GitHub dependency at every pod start (rate limits, outages, moved tags, deleted repos) and content drift between pods with identical manifests. C′ moves the GitHub pull into a sync job that can fail and retry without blocking a run. Both need **workload identity in the agent pod**, which this platform rules out ([ADR-003](./003-platform-services-vs-agent-pods.md)) — another platform may not.

## Consequences

**Accepted trade-offs**

| Trade-off | Notes |
|---|---|
| Skill change = image rebuild | The price of no runtime dependency and no runtime version management. |
| Baking is tidiness, not containment | Controls availability, not loading — see constraints above. |

## Open

- **Repo-supplied skills.** A cloned repo's `.agents/skills/` merges into the run. Acceptable or not needs deciding deliberately — currently nothing prevents it.
- **Unverified:** whether the `skills` CLI's `skills-lock.json` makes baked installs declarative and reproducible. It is an install-time artifact, not a goose-side filter.
