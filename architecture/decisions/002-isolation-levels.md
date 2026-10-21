# ADR-002: Isolation levels — settings, dev container, K8s pod

- **Status:** Accepted
- **Date:** 2026-10-21
- **Context:** Every place an agent runs — laptop and cloud.

## Context

- Agents run model-driven code. Before anything else, it has to be clear which mechanisms are a **boundary** and which only discourage.
- In-app permission rules (`.claude/settings.json` `allow`/`deny`) match command strings, not paths or syscalls. Bypassable — a deterrent.
- Real isolation needs an OS-level mechanism: container, VM, restricted user.
- Earlier docs listed more rungs (`sbx` microVM, full VM) with conflicting numbering. Only three are in use.

## Decision

| Level | Mechanism | Boundary? | Where |
|---|---|---|---|
| **0** | `allow`/`deny` rules in agent settings | **No** — deterrent only | anywhere, as hints |
| **1** | Dev container | **Yes** — filesystem: files outside the mounts don't exist. Shares the host kernel. | laptop, subscription-billed |
| **2** | K8s pod | **Yes** — container, shares the node kernel. Plus: not on the developer's machine, disposable per step. Target: no cloud identity, no K8s API access. | cloud, API keys |

Level 2 is not a stronger *kernel* boundary than Level 1 — both are containers. It is a different *environment*: nothing of the developer's is reachable, and the pod dies with the task.

### Target design

- Level 2 pods: `automountServiceAccountToken: false`, only a projected token with audience `token-broker` ([token broker](../reference/token-broker.md)). Agent pods hold no cloud identity and no K8s API access.
- Egress firewall: network designed so one can be added.

### MVP / POC scope

- Level 1 in daily use ([ADR-001](./001-dev-container-agent-identity.md), [dev container](../reference/dev-container.md)).
- Level 2 not built. Straight to AKS — no local cluster.
- No egress firewall (cost).

## Alternatives considered

| Option | Why not |
|---|---|
| Level 0 as the only control | Not a boundary. |
| Docker Sandboxes (`sbx`) microVM | Worked — own kernel. Local-machine only; does not lead to remote agents. Retired. |
| Full VM (Colima/Lima) | Separate kernel. Reserved for actively suspect code; not part of the agent setup. |
| gVisor / Kata for Level 2 | No PII, no compliance surface in this cluster. Revisit with multi-tenancy (namespaces per team/client are planned) or sensitive data. |

## Consequences

**Positive**

- One vocabulary across docs: "Level N" means one thing.
- Claims of "boundary" are limited to Levels 1 and 2.

**Accepted trade-offs**

| Trade-off | Notes |
|---|---|
| Shared kernel at both levels | A container escape reaches the host (Level 1) or node (Level 2). Accepted without PII or compliance requirements. |
| Level 1 boundary is only as tight as its mounts | Anything mounted is readable by the agent — e.g. the signing key and PAT in ADR-001. |
| Docker-in-Docker on Level 1 | The dev container feature runs privileged ([devcontainer README](../../.devcontainer/README.md)). A privileged container weakens the Level 1 boundary considerably. |
| No egress control (MVP) | A compromised agent can send data anywhere its network reaches. |
