# 🪿 autonomous-agents-setup

Working notes on running unsupervised coding agents — real isolation boundaries, their own git identity, orchestrated outside the IDE.

## AI-Native SDLC

```
   👤 me — human architect                 🪿 geese — unsupervised agents
   ─────────────────────────                ────────────────────────────
   prompt + confirm, then unattended        headless, no human to start

┌──────────────────────────┐             ┌──────────────────────────────┐
│ 💻 Host (my machine)     │             │ ☸️  Kubernetes                │
│                          │             │                              │
│  ┌────────────────────┐  │             │  ┌────────────────────────┐  │
│  │ 🐳 Dev Container   │  │             │  │ 🐳 Pod per agent step  │  │
│  │                    │  │             │  │                        │  │
│  │  Zed + Claude      │  │             │  │  🪿 goose              │  │
│  │  design, then runs │  │             │  │  runs the step         │  │
│  └────────────────────┘  │             │  └────────────────────────┘  │
└──────────────────────────┘             └──────────────────────────────┘
             │                                          │
             │  defines the work                        │  git push
             ▼                                          ▼
      ┌──────────────────────────────────────────────────────┐
      │ 🐙 GitHub — issues in, branches out                  │
      └──────────────────────────────────────────────────────┘
```

- **Me — the human architect.** [Dev container](./architecture/dev-container.md) on my laptop. I pair with the LLM on design; for implementation I prompt the agent, confirm its read-back, and it runs unattended to the PR.
- **The geese — unsupervised agents.** Pick up work I've already defined, run headless in Kubernetes, push a branch. No human prompt starts them.

The point is not to babysit sessions. No approving every change, no manually pushing to GitHub.

## Design Goals

### Security

- Isolation is a boundary, not config rules.
- Agent has own identity
  - separate cryptographically signed commits
  - own credentials for git and the forge — never deploy credentials
  - writes only to its own branches, issues / PR reviews where its role allows, and platform services

### Orchestration

- Runs headless. GitHub issue in, PR out.
- Visibility into a stuck or crashed agent that doesn't depend on it reaching GitHub.

### Agents (fit-for-purpose)

- Run _unsupervised_ outside the IDE, in parallel, without them colliding.
- Task specific agents, e.g. `frontend-dev` vs `backend-dev`, vs `qa-checker`
- Size-for-purpose, e.g. use cheaper models, which work fine in decomposed tasks.
- **One step, one goose, one pod.** No nesting — a goose spawning its own subagents means no per-step model control and no visibility, which is what I'm moving away from.

## Architecture

| | |
|---|---|
| [Isolation levels](./architecture/README.md) | What counts as a boundary, what's only a deterrent |
| [Dev container](./architecture/dev-container.md) | My interactive session. Current setup. |
| [goose](./architecture/goose-agent.md) | The agent runtime. ACP built in, model-agnostic. |
| [Identity](./architecture/identity.md) | Agent vs. me. Agent user account + GPG signing in both tiers; PAT in the dev container, broker-minted App token in the cloud. |
| [Orchestration](./architecture/orchestration.md) | GitHub → workflow service → Argo workflow → pod per step → PR |
| [GitHub configuration](./architecture/github-configuration.md) | Rulesets, environment-only secrets — no indirect path to credentials or production |
| [Decisions (ADRs)](./architecture/decisions/) | One decision per file, target design vs. MVP |

Spikes and working code: [`spikes/`](./spikes/). Retired directions: [`stale/`](./stale/). Deferred decisions, reasoning kept: [`architecture/parked/`](./architecture/parked/).

## Current Progress

### Agent Setup

- [X] Install and test goose
- [X] Connect Claude subscription via ACP (local dev)
- [X] Containerize goose — headless, API key, zero interactive setup
- [X] Drive goose programmatically over ACP
- [x] `gh` CLI in the image — pinned. [Detail](./spikes/goose-k8s-prep/).
- [x] Agent identity (dev container) — own account `julieio-agent`, classic PAT, GPG-signed commits show Verified. [ADR-001](./architecture/decisions/001-dev-container-agent-identity.md).
- [ ] Agent identity (cloud) — App token via the token broker. [ADR-012](./architecture/decisions/012-cloud-agent-identity.md).

### Orchestration

- [ ] AKS cluster — straight to Azure, no local cluster
- [ ] Workflow service + Argo Workflows — webhook in, one pod per agent step
- [ ] Token broker, artifact service

### Customization

- [ ] Package custom skills, MCP servers, plugins with goose agent.
- [ ] Deploy custom goose-agent as Docker image

## Decision Log

| Decision | Notes |
|---|---|
| Isolation | `settings.json` allow/deny rules are a deterrent, not a boundary. Container is the boundary. |
| My session | Dev container in Zed. Prompt + confirmed read-back, then unattended. [ADR-001](./architecture/decisions/001-dev-container-agent-identity.md) |
| Harness | goose. Model-agnostic, headless, AAIF-governed — no vendor lock-in. |
| LLM auth | My Claude Code / Codex subscription in the dev container; API keys via an AI gateway in the cloud. [ADR-006](./architecture/decisions/006-models-and-llm-access.md) |
| Agent identity | Own GitHub user account, GPG-signed commits. PAT in the dev container; App token from the broker in the cloud. [ADR-001](./architecture/decisions/001-dev-container-agent-identity.md), [ADR-012](./architecture/decisions/012-cloud-agent-identity.md) |
| Orchestration | Argo Workflows, one pod per agent step. No sidecar — ACP is native to goose. [ADR-004](./architecture/decisions/004-orchestration-argo-workflows.md) |
| No nested agents | One step, one goose, one pod. Specialization comes from the DAG, not from a goose spawning subagents. |

### Retired

| | Why |
|---|---|
| Docker Sandbox (`sbx`) | Worked, but local-machine only. Doesn't lead to remote agents. |
| `agent-manager` / session managers | Built for attaching to interactive panes. Webhook → pod → PR has no pane. |

Detail in [`stale/`](./stale/).

## References

- [agents.md](https://agents.md/)
- [goose](https://goose-docs.ai/) - open source AI Agent (part of [AAIF](https://github.com/aaif-goose/goose))
