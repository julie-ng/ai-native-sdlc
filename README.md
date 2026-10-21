# 🪿 autonomous-agents-setup

Design and context layer for an AI-native SDLC platform: **unsupervised coding agents** that take a scoped GitHub issue to a reviewed pull request — with real isolation boundaries, their own identity, and an enforced multi-agent workflow. Built in public; the polished overview is at [julie.io/ai-native-sdlc](https://julie.io/ai-native-sdlc).

![Two modes: an interactive session on my laptop writes scoped issues to GitHub; unsupervised agents in the cloud pull issues and open pull requests](./images/two-modes.svg)

**Pair & delegate.** Architecture and scoping stay interactive — me and a coding agent, on my laptop. Implementation runs headless in the cloud, one pod per agent step. GitHub issues are the handoff.

## What's here

- [Architecture](./architecture/) — how the platform works: use case, architecture, requirements, workflow
- [Decisions](./architecture/decisions/) — ADRs, one decision per file, target design vs. what the POC builds

This repo is where I design the platform and scope work. The components are built in their own repositories, where agents pick up the scoped tickets — without context from here, so a badly scoped ticket shows up as a failure.

## Status

- **Design** — [ADR-001 – 013](./architecture/decisions/) accepted
- **Dev container agent** — working: own GitHub account, GPG-signed commits, unattended runs after a confirmed read-back ([ADR-001](./architecture/decisions/001-dev-container-agent-identity.md))
- **goose in a container** — working with `docker run`: issue in, PR out
- **Cloud platform on AKS** — not yet built

### Next

- [ ] AKS cluster — straight to Azure, no local cluster
- [ ] Platform services — workflow service, artifact service, token broker
- [ ] Argo Workflows — webhook in, one pod per agent step
- [ ] Agent images — one per role, skills baked in

## References

- [agents.md](https://agents.md/)
- [goose](https://goose-docs.ai/) — open-source agent, part of [AAIF](https://github.com/aaif-goose/goose)
