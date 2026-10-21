# ADR-009: Stop conditions — cap, green, human

- **Status:** Accepted — design, not built
- **Date:** 2026-10-21 (decided 2026-10-20)
- **Context:** Cloud tier, coder ↔ reviewer / QA loops ([ADR-004](./004-orchestration-argo-workflows.md)).

## Context

- Loops cost money per pass. An unbounded loop is an unbounded bill.
- Exit code 0 does not mean the task succeeded ([goose-k8s-prep](../../spikes/goose-k8s-prep/)).

## Decision

Stop conditions stack:

1. **Iteration cap** — always on. Cost ceiling.
2. **QA green** — the normal exit.
3. **Human escalation** — when the cap is hit without green.

Per feature, only the cap value and the definition of "green" change.

- **Code for objective gates, prose for judgment.** Checkable gates (tests, lint) are code; judgment calls are instructions.
- **Long human waits:** pause at a defined checkpoint and let the pod go away. Resume as a new run or sub-run from the workflow service's state.
- Reviewers always start fresh.

### Target design

As above.

### MVP / POC scope

Not built.

## Consequences

**Accepted trade-offs**

| Trade-off | Notes |
|---|---|
| Bounded loops unroll into new DAG nodes | **Unverified:** Argo has no true loops; cycles are template recursion with a `when` guard. |

## Open

- Coder on rework: full session resume vs. fresh start vs. fresh start + structured handoff (review comments + notes via the artifact service).
- E2E environment: shared vs. per-branch preview; triage step (real bug / flaky / environment) before a failure reaches the coder.
