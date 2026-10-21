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

As above. No SCM gateway or other platform service for forge operations — the agent knows whether it is on GitHub or GitLab and uses the matching CLI.

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
| Forge-specific CLIs in the image (`gh`, `glab`) | The agent picks the right one; no abstraction layer. |

## Open

- **Unverified:** GitLab's GPG verification rules (key on a user account, matching email) — assumed similar to GitHub's, not checked.
