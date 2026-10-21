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
| Dapr Workflows | Argo judged more mature, wider adoption (**unverified**). Not CNCF status: both are graduated — Argo 2022-12-06, Dapr 2024-10-30 ([Argo](https://www.cncf.io/projects/argo/), [Dapr](https://www.cncf.io/projects/dapr/)). |
| Tekton | Rejected. Reason not recorded. |
| LangGraph | Licensing does not scale as a platform foundation; durable execution needs proprietary infrastructure by default (**unverified** — from memory). |
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
