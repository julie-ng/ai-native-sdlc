# 01 · Use case — why unsupervised agents in the cloud?

Three problems, in the order I hit them: agents read beyond the repository, dev containers fix that but don't scale, and every session still needs me to start it. The platform is designed to solve all three.

## Problem: agents read beyond the repository

On 14 July 2026, I found Claude Code exploring my computer outside the repository I had given it. When an agent is missing context, it gets resourceful. Technically, it can walk up the file tree and into `~/.ssh`.

![Soft versus hard boundary: on the laptop, permission rules draw a dashed line around the repository and the agent reads .ssh anyway; in a container, only the repository is mounted](../images/boundary.svg)

A clearer prompt and sandbox mode help. Neither is a boundary: by default, sandboxes limit what an agent can **write**, not what it can **read**.

<details>
<summary><strong>Why built-in agent sandboxes are not enough</strong></summary>

Sandboxes can offer granular access, which most developers do not configure. Even when they do, nuances can still let an LLM read beyond the working directory.

- **macOS permissions are coarse.** Privacy permissions come in fixed folder categories (Desktop, Documents, Downloads) or Full Disk Access, granted to the host app and inherited by the agent. There is no per-directory allowlist.
- **The sandboxes rest on a deprecated interface.** Claude Code and Codex apply Seatbelt profiles on macOS through `sandbox-exec`, which Apple marks as deprecated with no replacement for command-line processes ([apple/containerization#737](https://github.com/apple/containerization/issues/737)).
- **Working-directory-only reads are not the default.** Both sandboxes bound writes and network by default, not reads, and they cover only what they wrap: shell commands in Claude Code, spawned commands and built-in file operations in Codex.

</details>

### Isolation levels

What counts as a boundary. Decision: [ADR-002](./decisions/002-isolation-levels.md).

| Level | Mechanism | Boundary? |
|---|---|---|
| **0** | `allow`/`deny` rules in agent settings | **No** — matches command strings, not paths. A deterrent. |
| **1** | Dev container | **Yes** — filesystem. Shares the host kernel. Laptop. |
| **2** | K8s pod | **Yes** — container. Shares the node kernel. Cloud. |

## Solution? Dev containers

Zed, my IDE, supports dev containers, so I added a hard boundary without changing how I work. The `devcontainer.json` mounts only:

- **The repository**, at the same path as on my laptop. Nothing else from the host is visible.
- **Claude's memory directory** (`~/.claude`). Because the path is mirrored, the agent finds its project memory and keeps learnings between sessions.

The agent has its own GitHub identity in there, not mine ([identity](./reference/identity.md)). Setup and mounts: [dev container](./reference/dev-container.md).

This worked — but did not scale.

## Trade-off: scale

Each session still needed an initial prompt from me:

- which issue to pull down
- did it understand the task?
- does it need more information?

And 24 GB of RAM fit only 4–5 sessions in parallel. Each dev container runs its own agent and toolchain inside Docker's VM, so memory grows with every session until the next one no longer fits.

![Memory bottleneck: four dev containers fill the laptop's 24 GB of RAM, leaving no memory for a fifth](../images/memory.svg)

## Goal: pair locally, delegate to the cloud

Architecture and scoping stay interactive, because that is where human experience decides what gets built. Implementation runs headless in the cloud with proper security controls — that is what lets agentic development scale.

| | Interactive — laptop | Unsupervised — cloud |
|---|---|---|
| Where | dev container | one pod per agent step |
| Does | architect the solution, scope issues | implement scoped issues, no prompt from me |
| Access | developer's session, agent's own GitHub identity | fine-grained per task, isolated from the laptop |
| Models | Claude subscription, Opus | fit for the task — e.g. Sonnet or Codex — on API keys |

GitHub issues are the handoff between the two.

Next: [02 · Architecture](./02-architecture.md)
