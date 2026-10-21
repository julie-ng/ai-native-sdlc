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
- **Gates that need an LLM: consider OpenAI's [Decisions API](https://developers.openai.com/api/docs/guides/decisions).** Returns typed answers — probability a condition holds, a pick from fixed choices, a rating on ordered levels — instead of free text. Cost-effective: input tokens only, $0.10 per 1M. Status: public beta, one model (`gpt-6-luna`). Checked 2026-10-21.

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

- **Decisions API — deterministic?** OpenAI's guide does not say outputs are deterministic or repeatable for identical input. What is bounded is the output *shape* (fixed choices, typed answers). Verify before relying on repeatability.
- **Decisions API vs. provider-agnostic.** OpenAI-only endpoint and model; [ADR-004](./004-orchestration-argo-workflows.md) rejects provider-specific tooling for the platform. Keep it behind the gate's interface so a gate can swap to another model. **Unverified:** whether it is reachable through the AI gateway ([ADR-006](./006-models-and-llm-access.md)).
- Coder on rework: full session resume vs. fresh start vs. fresh start + structured handoff (review comments + notes via the artifact service).
- E2E environment: shared vs. per-branch preview; triage step (real bug / flaky / environment) before a failure reaches the coder.
