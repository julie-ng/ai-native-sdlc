# 🪿 autonomous-agents-setup

Design and context layer for an AI-native SDLC platform: **unsupervised coding agents** that take a scoped GitHub issue to a reviewed pull request — with real isolation boundaries, their own identity, and an enforced multi-agent workflow. Built in public; the polished overview is at [julie.io/ai-native-sdlc](https://julie.io/ai-native-sdlc).

![Two modes: an interactive session on my laptop writes scoped issues to GitHub; unsupervised agents in the cloud pull issues and open pull requests](./images/two-modes.svg)

**Pair & delegate.** Architecture and scoping stay interactive — me and a coding agent, on my laptop. Implementation runs headless in the cloud, one pod per agent step. GitHub issues are the handoff.

## What's here

| | |
|---|---|
| [Architecture](./architecture/) | How the platform works — use case, architecture, requirements, workflow |
| [Decisions](./architecture/decisions/) | ADRs — one decision per file, target design vs. what the POC builds |

This repo is where I design the platform and scope work. The components are built in their own repositories, where agents pick up the scoped tickets — without context from here, so a badly scoped ticket shows up as a failure.

## Status

| | |
|---|---|
| Design | ADR-001 – 013 accepted |
| Dev container agent | **working** — own GitHub account, GPG-signed commits, unattended runs after a confirmed read-back ([ADR-001](./architecture/decisions/001-dev-container-agent-identity.md)) |
| goose in a container | **working** with `docker run` — issue in, PR out |
| Cloud platform on AKS | **not yet built** |

### Next

- [ ] AKS cluster — straight to Azure, no local cluster
- [ ] Platform services — workflow service, artifact service, token broker
- [ ] Argo Workflows — webhook in, one pod per agent step
- [ ] Agent images — one per role, skills baked in

## Decision log

Full list with reasoning: [ADR index](./architecture/decisions/).

| Date | Decision | ADR |
|---|---|---|
| 2026-10-21 | Isolation levels — settings, dev container, K8s pod | [002](./architecture/decisions/002-isolation-levels.md) |
| 2026-10-21 | Models and LLM access — subscription on the laptop, API keys via an AI gateway in the cloud | [006](./architecture/decisions/006-models-and-llm-access.md) |
| 2026-10-21 | SCM-agnostic — native git, forge CLI only for forge objects | [008](./architecture/decisions/008-scm-agnostic-native-git.md) |
| 2026-10-21 | Skills location — `.agents/skills/`, symlinked for Claude Code | [011](./architecture/decisions/011-skills-location.md) |
| 2026-10-21 | Cloud agent identity — agent user commits, App token from the broker pushes | [012](./architecture/decisions/012-cloud-agent-identity.md) |
| 2026-10-21 | Skills distribution — baked for the POC, target left to the platform | [013](./architecture/decisions/013-skills-distribution.md) |
| 2026-10-20 | Dev container agent identity — own account, classic PAT, GPG signing | [001](./architecture/decisions/001-dev-container-agent-identity.md) |
| 2026-10-20 | Orchestration — Argo Workflows, one pod per agent step, no nesting | [004](./architecture/decisions/004-orchestration-argo-workflows.md) |
| 2026-10-20 | State and artifacts — workflow service DB + artifact service | [005](./architecture/decisions/005-state-and-artifacts.md) |
| 2026-10-20 | Stop conditions — cap, green, human | [009](./architecture/decisions/009-stop-conditions.md) |
| 2026-10-19 | Agent images — official goose base if smaller, one image per role | [010](./architecture/decisions/010-agent-images.md) |
| 2026-10-10 | Platform services vs. agent pods — agents get no cloud identity | [003](./architecture/decisions/003-platform-services-vs-agent-pods.md) |
| 2026-09-04 | Harness — goose as a thin harness | [007](./architecture/decisions/007-harness.md) |

## References

- [agents.md](https://agents.md/)
- [goose](https://goose-docs.ai/) — open-source agent, part of [AAIF](https://github.com/aaif-goose/goose)
