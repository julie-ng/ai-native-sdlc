# AI Native SDLC Platform

Design and context layer for an AI-native SDLC platform: **unsupervised coding agents** that take a scoped GitHub issue to a reviewed pull request — with real isolation boundaries, their own identity, and an enforced multi-agent workflow. Built in public.

![Two modes: an interactive session on my laptop writes scoped issues to GitHub; unsupervised agents in the cloud pull issues and open pull requests](./images/two-modes.svg)

**Pair & delegate.** Architecture and scoping stay interactive — me and a coding agent, on my laptop. Implementation runs headless in the cloud, one pod per agent step. GitHub issues are the handoff.

## What's here

This repo is where I design the platform and scope work. The components are built in their own repositories, where agents pick up the scoped tickets — without context from here, so a badly scoped ticket shows up as a failure.

- [Architecture](./architecture/) — how the platform works: use case, architecture, requirements, workflow
- [Decisions](./architecture/decisions/) — ADRs, one decision per file, target design vs. what the POC builds

> [!IMPORTANT]
> This is _not_ a reference architecture. It's a portfolio piece and proof of concept I'm building out in public to share my learnings – and to put my money where my mouth is. Although a POC, I'm still applying 10+ years of cloud engineering experience to set up enough guardrails and enforced security boundaries that I will let agents work unsupervised for me.
>
> For most individuals this setup is overkill. For most organizations, however, as a former enterprise architect, I consider this to be _minimum_ due diligence.

## Project Status

- **Design** — [ADR-001 – 016](./architecture/decisions/) accepted
- **Dev container agent** — working: own GitHub account, GPG-signed commits, unattended runs after a confirmed read-back ([ADR-001](./architecture/decisions/001-dev-container-agent-identity.md))
- **goose in a container** — working with `docker run`: issue in, PR out
- **Cloud platform on AKS** — [cluster deployed](./infrastructure/), Argo Workflows installed (hello-world step runs on the agent pool), Key Vault secrets in place
- **Platform services** — artifact API built, SAS signing verified against Azure; caller authentication and deployment next

### Next — initial release

One issue end to end in the cluster: start a run with the Argo CLI, a planner writes a plan, a coder implements it and opens a PR, I review and merge.

- [x] AKS cluster — deployed on Azure
- [x] Argo Workflows — installed with Helm
- [x] Agent images — shared [`agent-base`](./agent-images/) built
- [ ] Agent image published to the registry, goose running in an Argo pod
- [ ] Platform services — HMAC caller authentication, create the run, deploy to the cluster
- [ ] Workflow — `foreman → planner → coder`, started with `argo submit`

**Later:** token broker and GitHub App (a temporary token for now), reviewer step, webhook trigger, role images with skills baked in.

## What's New?

### 2026-11-05

**Decided**

- **Initial release scope:** one issue end to end in the cluster. Start a run with the Argo CLI; a planner writes a plan, a coder implements it and opens a PR, and I review and merge. No reviewer step yet.
- **HMAC tokens for platform services**, reusing my Tally Split implementation, so callers work without a cluster. Kubernetes ServiceAccount authentication is deferred. See [ADR-016](./architecture/decisions/016-hmac-caller-authentication.md).
- **One exception to "agents have no cloud identity":** the coder can read only its commit-signing key from Key Vault. See [ADR-003](./architecture/decisions/003-platform-services-vs-agent-pods.md#exception-workload-identity-for-the-commit-signing-key).
- **Shared agent instructions** now prefer the smallest implementation that meets the acceptance criteria, after agents kept proposing production-grade machinery for a POC.

**Added**

- **Argo Workflows installed** on AKS with Helm. See [Infrastructure](./infrastructure/).
- **Trusted `foreman` step:** its own identity and RBAC to create a run and hand each agent step a scoped token. Platform services consolidated into one identity.
- **Key Vault secrets created** by script: platform-service tokens and the agent's GPG signing key.

### 2026-11-04

**Validated**

- **Artifact SAS URLs** signed with user delegation keys, no storage account keys. Upload, download and overwrite work against Azure; wrong permissions and other containers return 403. See [ADR-015](./architecture/decisions/015-sas-signing-and-local-identity.md).

### 2026-11-01

**Added**

- **Artifact API** in [Platform services](./platform-services/): register, upload and download artifacts through scoped SAS URLs, backed by PostgreSQL. Plus logging, a readiness endpoint and an API docs site.

**Changed**

- Removed an unneeded service layer from platform services in favor of explicit guards and plain functions.

### 2026-10-27

**Added**

- **Cost control:** GitHub workflow stops AKS and PostgreSQL manually and daily at 8pm.

### 2026-10-25

**Decided**

- **Commit signing:** native Git with GPG, one key per agent role. See [ADR-014](./architecture/decisions/014-commit-signing.md).

**Added**

- [GitHub token broker](./github-broker/) bootstrapped, and the [workflows](./workflows/) repo created.

**Validated**

- **Agent pod restrictions:** agent pods can't reach the cloud metadata endpoint (IMDS), and privileged pods such as `hostNetwork` are rejected.

### 2026-10-22

**Added**

- **Azure infrastructure deployed:** AKS cluster, networking, shared services and workload identities. See [Infrastructure](./infrastructure/).
- **Agent base image built:** Goose on Debian, with Python and Node, running as a non-root user. AMD64 build and offline smoke checks passed. See [Agent images](./agent-images/).

**Decided**

- Use GitHub CLI for GitHub operations and keep Goose a light wrapper around capable models, prioritizing API-token cost efficiency. See [Image ADRs](./agent-images/architecture/decisions/).

### 2026-10-20

**Design**

- Established the platform architecture and ADRs covering isolation, Argo orchestration, agent identity, credentials and completion gates. See [Architecture](./architecture/).

**Validated**

- Dev container agents commit under their own GitHub identity with GPG signatures. See [ADR-001](./architecture/decisions/001-dev-container-agent-identity.md)

## Resources

Inspired by

- [Build Systems, Not Code - Angie Jones, Agentic AI Foundation](https://www.youtube.com/watch?v=ZD9-4fW2HhM) AI Engineer, YouTube, 25 June 2026
- [Building an Autonomous Engineering Org - Angie Jones, Agentic AI Foundation](https://youtu.be/whue9_YquGA?si=7K0xn9DqN3oSDtUT) – AI Engineer, YouTube, 28 June 2026
- [Agents Without Code: Skills, YAML, and Filesystems Replaced Python — Philipp Schmid, Google DeepMind](https://www.youtube.com/watch?v=fjF8EKnxKCU) – AI Engineer, YouTube, 28 June 2026
- [Why Software Factories Fail – Dex Horthy, Human Layer](https://www.youtube.com/watch?v=Ib5GBkD555M)  AI Engineer, YouTube, 23 July 2026
- [The State of AI in Software Development: Data from 400+ Orgs — Justin Reock, DX](https://www.youtube.com/watch?v=Se8jHLliLXE) – AI Engineer, YouTube, 30 Sept. 2026.
- [12 Factor Agents - Principles for building reliable LLM applications](https://github.com/humanlayer/12-factor-agents) Human Layer, 2025.
