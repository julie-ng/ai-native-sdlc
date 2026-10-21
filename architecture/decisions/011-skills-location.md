# ADR-011: Skills location — `.agents/skills/`, symlinked for Claude Code

- **Status:** Accepted
- **Date:** 2026-10-21
- **Context:** Repos worked by Claude Code, Codex, Copilot, goose.

## Context

- Instructions and skills are the only surfaces truly shared across agents. Hooks, MCP and permissions are per agent.
- Claude Code preloads skill names and descriptions (auto-triggering, `/skill-name`) only from `.claude/skills`. A prose pointer elsewhere would weaken triggering.

## Decision

- Skills live canonically in **`.agents/skills/`**.
- **`.claude/skills` is a symlink** to it.

### Target design

As above, in every agent-worked repo.

### MVP / POC scope

Not yet applied in this repo.

## Consequences

**Accepted trade-offs**

| Trade-off | Notes |
|---|---|
| Symlinks in the repo | Must survive checkout on every platform agents run on. |

## Open

- Whether goose reads `.agents/skills/` natively.
- `CLAUDE.md` as a one-line `@AGENTS.md` import — recommended, not formally decided.
- Nested `AGENTS.md` handling: prose rule, generated per-directory `CLAUDE.md`, or a hook injecting the nearest one.
- **Unverified:** Copilot may load both `AGENTS.md` and `CLAUDE.md`, ingesting instructions twice.
