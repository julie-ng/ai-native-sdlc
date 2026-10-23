# AI Native SDLC Platform

Design and context layer for an AI-native SDLC platform: **unsupervised coding agents** that take a scoped GitHub issue to a reviewed pull request — with real isolation boundaries, their own identity, and an enforced multi-agent workflow. Built in public.

![Two modes: an interactive session on my laptop writes scoped issues to GitHub; unsupervised agents in the cloud pull issues and open pull requests](./images/two-modes.svg)

**Pair & delegate.** Architecture and scoping stay interactive — me and a coding agent, on my laptop. Implementation runs headless in the cloud, one pod per agent step. GitHub issues are the handoff.

## What's here

This repo is where I design the platform and scope work. The components are built in their own repositories, where agents pick up the scoped tickets — without context from here, so a badly scoped ticket shows up as a failure.

- [Architecture](./architecture/) — how the platform works: use case, architecture, requirements, workflow
- [Diagram design](./DESIGN.md) — visual guide, SVG references and authoring skill
- [Decisions](./architecture/decisions/) — ADRs, one decision per file, target design vs. what the POC builds

> [!IMPORTANT]
> This is _not_ a reference architecture. It's a portfolio piece and proof of concept I'm building out in public to share my learnings – and to put my money where my mouth is. Although a POC, I'm still applying 10+ years of cloud engineering experience to set up enough guardrails and enforced security boundaries that I will let agents work unsupervised for me.
>
> For most individuals this setup is overkill. For most organizations, however, as a former enterprise architect, I consider this to be _minimum_ due diligence.

## Status

- **Design** — [ADR-001 – 013](./architecture/decisions/) accepted
- **Dev container agent** — working: own GitHub account, GPG-signed commits, unattended runs after a confirmed read-back ([ADR-001](./architecture/decisions/001-dev-container-agent-identity.md))
- **goose in a container** — working with `docker run`: issue in, PR out
- **Cloud platform on AKS** — [cluster deployed](./infrastructure/); platform services and workflows next

### Next

- [x] AKS cluster — deployed on Azure
- [ ] Platform services — workflow service, artifact service, token broker
- [ ] Argo Workflows — webhook in, one pod per agent step
- [x] Agent images — shared [`agent-base`](./agent-images/) built
- [ ] Role images — one per role, skills baked in

## Resources

Inspired by

- [Build Systems, Not Code - Angie Jones, Agentic AI Foundation](https://www.youtube.com/watch?v=ZD9-4fW2HhM) AI Engineer, YouTube, 25 June 2026
- [Building an Autonomous Engineering Org - Angie Jones, Agentic AI Foundation](https://youtu.be/whue9_YquGA?si=7K0xn9DqN3oSDtUT) – AI Engineer, YouTube, 28 June 2026
- [Agents Without Code: Skills, YAML, and Filesystems Replaced Python — Philipp Schmid, Google DeepMind](https://www.youtube.com/watch?v=fjF8EKnxKCU) – AI Engineer, YouTube, 28 June 2026
- [Why Software Factories Fail – Dex Horthy, Human Layer](https://www.youtube.com/watch?v=Ib5GBkD555M)  AI Engineer, YouTube, 23 July 2026
- [The State of AI in Software Development: Data from 400+ Orgs — Justin Reock, DX](https://www.youtube.com/watch?v=Se8jHLliLXE) – AI Engineer, YouTube, 30 Sept. 2026.
- [12 Factor Agents - Principles for building reliable LLM applications](https://github.com/humanlayer/12-factor-agents) Human Layer, 2025.
