# ADR-004: Orchestration — Argo Workflows, one pod per agent step

- **Status:** Accepted — design, not built
- **Date:** 2026-10-21 (final decision 2026-10-20)
- **Context:** Cloud tier. Supersedes the single-Job shape in [orchestration.md](../orchestration.md) and Argo Events in [phase 2](../../spikes/orchestration-k8s-phase-2.md).

## Context

- Goal: an **enforced** multi-agent workflow — separate reviewer, visible passes-until-green, which agents ran, model choice per step — not one agent reviewing itself.
- Each step needs its own tools, permissions, model and config.
- Intermediate state must not flood humans via GitHub issues, PRs or artifacts.

## Decision

- **Flow:** GitHub webhook → workflow service → Argo workflow → one pod per agent step → PR → pods terminate.
- **Argo Workflows** is the engine. Agent per step = container per step.
- Declarative DAGs from shared templates; multiple coding-loop types per team or client.
- **No nesting.** An agent does not spawn agents; specialization comes from the DAG.
- **No sidecar.** ACP is native to goose; logs via `kubectl logs -f`.
- **No Argo Events.** The webhook goes straight to the workflow service. May revisit.
- Warm pods out of scope; make pod startup cheap instead.

**Decisive reason for Argo:** the in-cluster artifact service ([ADR-005](./005-state-and-artifacts.md)). Any pod writes to it without crossing a trust boundary. GitHub Actions runners would need a complex secure integration back into the cluster.

Further reasons: CNCF graduated, SCM-agnostic (eases GitHub → GitLab), platform-team ownership of the pipeline, not each repo's developers.

### Target design

As above, on AKS.

### MVP / POC scope

Not built. Proven so far: one goose container, issue → PR, with plain `docker run` ([goose-k8s-prep](../../spikes/goose-k8s-prep/)). Never run in K8s.

## Alternatives considered

| Option | Why not |
|---|---|
| GitHub Actions | Runners outside the cluster; artifact handoff needs a complex secure integration; GitHub-only. |
| Temporal | Self-hosted: operationally complex and expensive. Temporal Cloud: a hosted service — cannot run inside the cluster, and ties the platform to a provider. |
| Vercel Workflow DevKit | Model-agnostic, but a hosted service — cannot run inside the cluster, and ties the platform to a provider. |
| Dapr Workflows | Less mature. Argo Workflows dates from 2017; Dapr Workflows was alpha in v1.10 (2023-02) and stable only in v1.15 (2025-02), with workflow features still in preview ([v1.10](https://github.com/dapr/dapr/releases/tag/v1.10.0), [v1.15](https://blog.dapr.io/posts/2025/02/27/dapr-v1.15-is-now-available/), [preview features](https://docs.dapr.io/operations/support/support-preview-features/)). Wider adoption: **unverified**. Not CNCF status — both graduated ([Argo](https://www.cncf.io/projects/argo/) 2022-12-06, [Dapr](https://www.cncf.io/projects/dapr/) 2024-10-30). |
| Tekton | Rejected. Reason not recorded. |
| LangGraph | Library is MIT, but the server runtime is source-available (Elastic License 2.0 — no offering as a hosted/managed service) and self-hosted deployment is an Enterprise add-on with a license key. Durability is opt-in: wire a checkpointer (the Postgres one is MIT); the managed runtime that does it for you is the ELv2 / Enterprise part. ([license](https://github.com/langchain-ai/langgraph/blob/main/LICENSE), [ELv2](https://www.elastic.co/licensing/elastic-license), [self-hosted](https://docs.langchain.com/langsmith/self-hosted), [checkpointers](https://docs.langchain.com/oss/python/langgraph/checkpointers)) |
| LLM-provider agent SDKs and infra (OpenAI Agents SDK, Anthropic's offerings) | Platform must be provider-agnostic — any cloud (Azure, AWS, GCP), any model (OpenAI, Anthropic, open-weight). Proprietary provider tooling breaks that. |
| Bare K8s Job + init container | Earlier shape. One container, no DAG, no per-step role. |
| Argo Events + one workflow per iteration, loop state in the PR | Puts intermediate state in GitHub. |

## Consequences

**Positive**

- Per-step image, permissions and model.
- Workflow shape is data (templates), owned by the platform.

**Accepted trade-offs**

| Trade-off | Notes |
|---|---|
| More platform to run | Argo, workflow service, artifact service, broker. |
| Cold start per step | No warm pool. |
| No mid-task steering | Watching logs, not steering. ACP available if that changes. |
