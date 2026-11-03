# AGENTS.md

## About this repo

- Design notes for an autonomous-agent setup. **Documentation, not an app.**
- Mostly markdown. Some Dockerfiles and diagrams.
- Work-in-progress — contents change constantly. Optimize for fast scanning.
- `architecture/` holds design docs, one topic per file. `spikes/` holds narrow experiments.
- **These notes justify a security boundary — wrong details are load-bearing.**

## Reading order

- Read the [architecture index](./architecture/README.md), then the [ADR index](./architecture/decisions/README.md), then the design docs and ADRs relevant to the prompt.

## Shared instructions

Read and follow these alongside this repo’s project-specific instructions. Explicit project-specific exceptions override shared defaults; otherwise both apply.

- [Working practices](./.agents/shared/working-practices.md)
- [Communication and writing](./.agents/shared/communication.md)
- [Cross-session memory](./.agents/shared/memory.md)
- [Git & GitHub workflow](./.agents/shared/github-workflow.md)
