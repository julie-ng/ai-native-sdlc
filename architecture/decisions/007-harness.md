# ADR-007: Harness — goose in the cloud, Claude Code / Codex on the laptop

- **Status:** Accepted
- **Date:** 2026-10-21 (goose chosen 2026-09-04)
- **Context:** Both tiers. Detail: [goose-agent.md](../goose-agent.md).

## Context

- Cloud agents run headless, outside an IDE.
- The underlying coding agent and model should be swappable.
- Principle: no vendor lock-in; prefer foundation-governed tools (CNCF, AAIF).

## Decision

| Tier | Harness |
|---|---|
| Dev container | Claude Code or Codex, on the developer's subscription ([ADR-006](./006-models-and-llm-access.md)) |
| Cloud | **goose** ([AAIF](https://aaif.io/projects/goose)) |

**Why goose:**

- Model-agnostic — provider config, not front-end changes.
- Headless: `goose run` with recipes; no interactive setup.
- ACP native — `goose session`, `goose acp`, `goosed` are one agent core. No sidecar, no wrapper.
- Recipes, skills, extensions configurable per agent role.
- Foundation-governed.

### Target design

As above.

### MVP / POC scope

goose headless in a container, issue → PR, proven with `docker run` ([goose-k8s-prep](../../spikes/goose-k8s-prep/)).

## Alternatives considered

| Option | Why not |
|---|---|
| Claude Code headless in pods | Vendor-specific. |
| LangChain Deep Agents | Harness library; more plumbing. |

## Consequences

**Accepted trade-offs**

| Trade-off | Notes |
|---|---|
| Two harnesses | Laptop and cloud differ. Shared surface is instructions and skills ([ADR-011](./011-skills-location.md)). |
| goose skills have no per-recipe governance | Extensions are scoped per recipe, skills are not; a skill can derail a headless run. |
| goose does not commit on its own | The pod's wrapper commits and pushes ([goose-k8s-prep](../../spikes/goose-k8s-prep/)). |

## Open

- Whether goose reads `AGENTS.md` and `.agents/skills/` natively.
