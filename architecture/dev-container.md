# Dev Container — laptop tier

Where I work, and where an agent runs on my laptop. I pair with the LLM on design; for implementation I prompt the agent, it repeats back what it will do, I confirm, and it runs **unattended** through to the PR ([ADR-001](./decisions/001-dev-container-agent-identity.md)).

Cloud agents — no human prompt to start them — run in Kubernetes: see [orchestration.md](./orchestration.md).

[Isolation Level 1](./README.md) — dev containers in Zed. [ADR-002](./decisions/002-isolation-levels.md).

## Why

- Agent cannot `cd ../` into the parent folder.
- Memory persists across sessions.
- My personal credential files — `~/.ssh`, `~/.aws/credentials` — aren't accessible.
- The agent pushes and opens PRs as itself, not as me — its own account, PAT and GPG key, mounted read-only ([ADR-001](./decisions/001-dev-container-agent-identity.md)).

## Limits

Why the cloud tier exists as well:

- Shared host kernel.
- Runs on my laptop, on my subscription — one machine, started by me.
- Claude owns and drives subagents:
  - No _per-task_ model selection. Subagents inherit the main session's model, e.g. Opus — not cost effective. `CLAUDE_CODE_SUBAGENT_MODEL` isn't task-configurable.
  - No visibility into subagents. Wait until it finishes to find out it hallucinated. I want live inspection and course-correction.
- No enforced workflow — no separate reviewer, no stop conditions outside the session.

## Setup

To persist Claude's memory across sessions, via mounts:

- **Persisted Memory** — `~/.claude`, keyed by workspace path slug
- **Workspace Folder** — mirroring the exact host path so the slug matches

The host path is hard-coded into the config. Working example: [`.devcontainer/devcontainer.sample.json`](../.devcontainer/devcontainer.sample.json), explained in [`.devcontainer/README.md`](../.devcontainer/README.md).

> [!WARNING]
> **Do not mount `~/.claude.json`.** Concurrent writes from host and container truncated it mid-write — invalid JSON, blocked new sessions from starting. No locking, two writers, one file.

Trade-offs of skipping it:

- folders need re-trusting every time
- need in-repo `.mcp.json`

## Decision log

| Decision | Notes |
|---|---|
| Isolation | Dev container (Level 1). Filesystem boundary, shared kernel. |
| Role | My session, and unattended agent runs started by my prompt + confirmed read-back. |
| Mounts | `~/.claude` yes, `~/.claude.json` never. Mirror the host workspace path. |
| MCP | In-repo `.mcp.json` instead of project-scoped config. |
