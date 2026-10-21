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

**goose reads `.agents/skills/` natively** — project-level `.agents/skills/`, global `~/.agents/skills/`; "`agents/skills/` is the recommended standard." It also discovers `.goose/skills/` and `.claude/skills/` for backward compatibility ([goose: using skills](https://goose-docs.ai/docs/guides/context-engineering/using-skills)). goose reads `AGENTS.md` by default, from the working directory up to the repo root and from nested subdirectories it accesses ([goose: context files](https://goose-docs.ai/docs/guides/context-engineering/using-goosehints)).

### Target design

As above, in every agent-worked repo.

### MVP / POC scope

Applied for the [julie.io diagram skill](../../.agents/skills/julie-io-diagrams/SKILL.md): tracked in `.agents/skills/`, with `.claude/skills` symlinked to it. Other local skills remain ignored. Harness discovery and duplicate loading have not been tested here.

## Consequences

**Accepted trade-offs**

| Trade-off | Notes |
|---|---|
| Symlinks in the repo | Must survive checkout on every platform agents run on. |

## Open

- **Unverified:** goose discovers both `.agents/skills/` and `.claude/skills/` — with the symlink, the same skills may load twice.
- `CLAUDE.md` as a one-line `@AGENTS.md` import — recommended, not formally decided.
- Nested `AGENTS.md` handling: prose rule, generated per-directory `CLAUDE.md`, or a hook injecting the nearest one.
- **Unverified:** Copilot may load both `AGENTS.md` and `CLAUDE.md`, ingesting instructions twice.

## Decision log

| Date | Decision | Notes |
|---|---|---|
| 2026-10-21 | Track the project diagram skill in the canonical directory and add the Claude symlink | Narrow ignore exceptions keep other local skills untracked. Discovery across harnesses remains unverified. |
