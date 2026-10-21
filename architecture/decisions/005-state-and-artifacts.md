# ADR-005: State and artifacts — workflow service DB + artifact service

- **Status:** Accepted — design, not built
- **Date:** 2026-10-21 (decisions from 2026-09-04 to 2026-10-20)
- **Deciders:** Julie Ng
- **Context:** Cloud tier. Updates [infra-design.md](../infra-design.md): agents no longer write Blob directly.

## Context

- Pods are stateless per task. State crosses agent boundaries only by explicit handoff.
- Agent pods have no cloud identity ([ADR-003](./003-platform-services-vs-agent-pods.md)).
- Long-term goal: keep run data (logs, Markdown artifacts, screenshots) so agents can improve.

## Decision

| State | Lives in |
|---|---|
| Business state — runs, retries, start times, per-task cost from goose token usage | **Workflow service**, own database |
| Execution state | **Argo** — minimal; small string params duplicated in both |
| Handoffs between steps — summaries, notes, logs, screenshots | **Artifact service**, backed by Blob Storage |
| Intermediate working state | **never** in GitHub/GitLab |

- Every agent step **emits an artifact** on completion and exits with one of a **fixed set of outcomes**, which drive DAG branching.
- **Create-only.** Each agent creates its own artifacts; none overwrites another's. Avoids concurrent-write conflicts by construction.
- One PostgreSQL server for workflow service and Argo, separate databases and users.

### Target design

As above, on AKS with Azure Blob Storage and PostgreSQL.

### MVP / POC scope

Not built.

## Alternatives considered

| Option | Why not |
|---|---|
| State in the PR / issue comments | Floods humans with noise; ties state to one SCM. |
| Agents write Blob directly | Requires cloud identity in agent pods. |

## Consequences

**Accepted trade-offs**

| Trade-off | Notes |
|---|---|
| Argo uses a stored database password | Isolated in its own namespace. |
| Two places hold small params | Duplication accepted to keep Argo swappable. |

## Open

- Artifact naming/addressing so a downstream step finds an upstream step's output.
