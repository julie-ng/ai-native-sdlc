# Infra design — high level

> [!NOTE]
> Draft. Decisions now live in [ADR-004](./decisions/004-orchestration-argo-workflows.md), [ADR-005](./decisions/005-state-and-artifacts.md) and [ADR-006](./decisions/006-models-and-llm-access.md). Cross-link with [orchestration.md](./orchestration.md).

Scope: where things live at runtime across agent steps. `orchestration.md` covers the workflow's shape.

## Model per step

- Each agent step = its own pod = its own goose process. Model is process-level config in goose (`GOOSE_PROVIDER` / `GOOSE_MODEL` env, or baked `active_provider`) — confirmed in [goose-agent.md](./goose-agent.md) and the containerizing-goose spike.
- One process can't switch models mid-run. But each step is a new pod anyway, so each step can get its own model — falls out of the pod-per-step shape for free.
- Goal: fit-for-purpose models — cheap model for narrow/mechanical steps, stronger model for judgment-heavy steps.
- Mechanism: the workflow template sets `GOOSE_MODEL` / `GOOSE_PROVIDER` on each step's container.
- **Open question:** who picks the model per step — workflow template, or a human at submit time. Not decided yet.

## Shared state: artifact service, not shared local state

- No shared *local* state between agent pods — state crosses step boundaries only by explicit handoff.
- Artifacts that move between steps go through the **artifact service**, backed by Azure Blob Storage. Agents authenticate to it with HMAC tokens; they hold no cloud identity ([ADR-003](./decisions/003-platform-services-vs-agent-pods.md)).
- **Invariant: create-only, never overwrite.** Each agent only CREATEs its own artifacts; no agent overwrites another's. Sidesteps concurrent-write conflicts entirely rather than solving them (locking, merge, last-write-wins — none needed if writes never collide by construction).
- Read access can be shared; write access is single-owner per artifact.
- **Open question:** naming/addressing scheme so a downstream step can find an upstream step's artifact (run ID + step? Not designed yet.)

## Decision log

| Date | Decision | Notes |
|---|---|---|
| 2026-10-21 | Subscription on the laptop, API keys via AI gateway in the cloud | [ADR-006](./decisions/006-models-and-llm-access.md) |
| 2026-10-20 | Agents reach artifacts through the artifact service | Agents hold no cloud identity. [ADR-005](./decisions/005-state-and-artifacts.md) |
| 2026-10-10 | Agent pods get no cloud identity; platform services use workload identity | [ADR-003](./decisions/003-platform-services-vs-agent-pods.md) |
| 2026-09-04 | Model is chosen per step, not fixed cluster-wide | Falls out of pod-per-step; set via env on each step's container. [ADR-006](./decisions/006-models-and-llm-access.md) |
| 2026-09-04 | Cross-agent artifacts in Azure Blob Storage, create-only | Avoids multi-writer problem by construction. [ADR-005](./decisions/005-state-and-artifacts.md) |
