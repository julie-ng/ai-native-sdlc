# Orchestration

GitHub issue → workflow service → Argo workflow → one pod per agent step → PR. No human at a terminal.

Decisions: [ADR-004](./decisions/004-orchestration-argo-workflows.md) (Argo Workflows), [ADR-005](./decisions/005-state-and-artifacts.md) (state), [ADR-009](./decisions/009-stop-conditions.md) (stop conditions).

```
┌─────────────────────────────────────────────────────────────┐
│ 🐙 GitHub                                                   │
│  Issue or comment                                           │
└──────────────────────────┬──────────────────────────────────┘
                           │ webhook
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ ☸️  Kubernetes (AKS)                                         │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Workflow service  (platform)                          │  │
│  │ validates, filters, owns run state, submits workflow  │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │ submits                      │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Argo workflow — DAG, one pod per agent step           │  │
│  │                                                       │  │
│  │  planner ──► coder ◄──► reviewer ──► open-PR step     │  │
│  │                                                       │  │
│  │  each pod: own image, role, model; token from broker; │  │
│  │  artifacts + status to the artifact service           │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ git push (broker token, HTTPS)
                           ▼
                    ┌─────────────┐
                    │ 🐙 branch   │
                    │ → PR        │
                    └─────────────┘
```

## Why this shape

- **One pod per agent step.** Each step gets its own tools, permissions, model and config. Pods are stateless and go away when the step ends.
- **No nesting.** An agent does not spawn agents; specialization comes from the DAG.
- **Enforced workflow.** A separate reviewer, visible passes-until-green — not one agent reviewing itself.
- **State outside GitHub.** Run state in the workflow service, handoffs in the artifact service. GitHub gets the branch and the PR.
- **The pod is a boundary, not a trust grant.** Agent pods run untrusted, model-driven code ([ADR-002](./decisions/002-isolation-levels.md), [ADR-003](./decisions/003-platform-services-vs-agent-pods.md)). See [identity.md](./identity.md) for what credentials they hold.
- **One container per pod.** goose has ACP built in — no sidecar. See [goose-agent.md](./goose-agent.md).

## Known sharp edges

Known and deferred.

- **Trigger filtering.** Fire on every `issue_comment` and the agent's own PR comment triggers another run. Needs an explicit opt-in — magic comment or label. Filtering lives in the workflow service.
- **Branch collisions.** Hardcoded branch names break on concurrent runs. Parameterize.
- **Prompt injection.** Issue text goes straight into the agent's prompt. On a public repo that's untrusted input — limited by the pod's downscoped, short-lived token and the repo configuration, not removed.
- **Runaway cost.** Bounded by the iteration cap ([ADR-009](./decisions/009-stop-conditions.md)) and step timeouts.
- **Silent failure.** Agents report status through platform services; nothing depends on the agent reaching GitHub.

## Decision log

| Decision | Notes |
|---|---|
| Unit of work | One pod per agent step, in an Argo workflow. [ADR-004](./decisions/004-orchestration-argo-workflows.md). |
| Trigger | GitHub webhook → workflow service. No Argo Events. |
| Isolation | Standard container. No gVisor/Kata — no PII or compliance surface. [ADR-002](./decisions/002-isolation-levels.md). |
| Containers per pod | One (goose). No sidecar. |
| Observability | Step status and artifacts via platform services; `kubectl logs -f` while building. |
| ~~K8s `Job` + init container (clone + identity)~~ | **Superseded** by Argo Workflows, one pod per step; identity via the token broker. |

### Accepted Trade-Offs

| Tradeoff | Notes |
|---|---|
| Shared kernel | Container, not microVM. No PII or compliance requirement; revisit with multi-tenancy. |
| No mid-task intervention | Watching logs, not steering. ACP is available if that changes. |
| Cold start per step | No warm pool. Make pod startup cheap instead. |
