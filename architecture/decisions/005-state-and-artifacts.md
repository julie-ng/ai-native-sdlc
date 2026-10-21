# ADR-005: State and artifacts — workflow service DB + artifact service

- **Status:** Accepted — design, not built
- **Date:** 2026-10-21 (decisions from 2026-09-04 to 2026-10-20)
- **Context:** Cloud tier. Agents no longer write Blob directly — see [02 · Architecture](../02-architecture.md#state).

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
- **Argo gets a database** — used for its workflow archive and node status offloading ([archive](https://argo-workflows.readthedocs.io/en/release-4.1/workflow-archive/), [offloading](https://argo-workflows.readthedocs.io/en/latest/offloading-large-workflows/)). Revisit during the build whether Argo needs it from the start.
- **Argo authenticates to Postgres via workload identity**, no stored password. Entra ID token auth (`azureToken`) supports "Workload Identity, Managed Identity and other standard mechanisms", available "v4.1 and after". v4.1 is a stable release: v4.1.0 on 2026-08-11, latest v4.1.5 on 2026-10-09 ([releases](https://github.com/argoproj/argo-workflows/releases)). `userNameSecret` is still required; `passwordSecret` is unused.
- etcd objects stay under 1MB by design — business state lives in the workflow service, not in Argo.

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
| Two places hold small params | Duplication accepted to keep Argo swappable. |

## Open

- Artifact naming/addressing so a downstream step finds an upstream step's output.
