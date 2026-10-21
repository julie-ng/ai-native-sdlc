# ADR-008: SCM-agnostic — native git, forge CLI only for forge objects

- **Status:** Accepted
- **Date:** 2026-10-21
- **Context:** Both tiers. Must work for GitHub and GitLab.

## Context

- The platform must not lock to one forge.
- Forges differ in vocabulary — issues vs. work items, pull requests vs. merge requests — and in API.
- Git itself is the same everywhere.

## Decision

- Agents use **plain `git`** for clone, commit, push. Commits are signed at `git commit` with GPG.
- **No API-created commits** (e.g. GitHub's `createCommitOnBranch`), even where they would be auto-signed.
- Forge CLIs (`gh`, `glab`) only for forge objects: issues / work items, PRs / MRs, reviews.

### Target design

- **SCM gateway (open):** keep git native; put only forge API calls behind a platform service with pipeline verbs (`open_change`, `submit_review`), not a lowest-common-denominator SCM API. Possibly co-located with the token broker.

### MVP / POC scope

- `gh` + plain git, GitHub only.

## Alternatives considered

| Option | Why not |
|---|---|
| API-created commits | GitHub-specific; and changes how commits are made per forge. |

## Consequences

**Positive**

- Same commit path on every forge. Signing works the same way.

**Accepted trade-offs**

| Trade-off | Notes |
|---|---|
| Forge-specific prompts / tooling for issues and PRs | Until the gateway exists. |

## Open

- **Unverified:** GitLab's GPG verification rules (key on a user account, matching email) — assumed similar to GitHub's, not checked.
