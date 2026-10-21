# ADR-006: Models and LLM access — subscription on the laptop, API keys in the cloud

- **Status:** Accepted
- **Date:** 2026-10-21
- **Deciders:** Julie Ng
- **Context:** Both tiers.

## Context

- Laptop runs start with the human developer's prompt ([ADR-001](./001-dev-container-agent-identity.md)). Cloud runs start without a human.
- Goal: fit-for-purpose models — cheap for narrow, mechanical steps; stronger for judgment.

## Decision

| | Dev container (Level 1) | Cloud (Level 2) |
|---|---|---|
| Billing | developer's Claude Code / Codex **subscription** | **API keys**, agent's own |
| Login | browser login, integration via Zed | none — key supplied at runtime |
| Models | Opus for interactive work | task-fit per step — Sonnet or Codex under consideration |
| Gateway | — | Vercel AI Gateway |

- **Model per step.** One goose process cannot switch models mid-run, but each step is its own pod, so each gets its own model via `GOOSE_PROVIDER` / `GOOSE_MODEL`. Env vars override the baked `active_provider` in-container — confirmed in the [goose-container](../../spikes/goose-container/) and [goose-k8s-prep](../../spikes/goose-k8s-prep/) spikes.
- The agent's GitHub identity is its own in both tiers; only the LLM billing differs.

### Target design

Cloud: gateway choice open between Vercel AI Gateway and a cloud-provider gateway.

- API key delivered as a **file**, per the principle "credentials as files, never env vars".

### MVP / POC scope

- Dev container on subscription: in use.
- Vercel AI Gateway with API key: working in spikes (`docker run`, not K8s). Spikes pass the key as env var `AI_GATEWAY_API_KEY` — not yet the target.

## Alternatives considered

| Option | Why not |
|---|---|
| Subscription for cloud agents | No human present; the subscription belongs to the developer. |
| Claude-only | Model-agnostic is a goal; Codex, Qwen etc. via the gateway. |

## Consequences

**Accepted trade-offs**

| Trade-off | Notes |
|---|---|
| Laptop agent borrows the developer's LLM subscription | GitHub identity stays separate. |
| Vercel AI Gateway is outside the VNet | Credits and easy provider swapping. |

## Open

- Who picks the model per step — workflow template, orchestrating agent, or human.
- Don't verify a model swap by asking the model; check billing or goose config.
