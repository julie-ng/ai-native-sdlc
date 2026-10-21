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
- ACP native — `goose session`, `goose acp`, `goosed` are one agent core. No sidecar, no ACP adapter.
- Recipes, skills, extensions configurable per agent role.
- Foundation-governed.

**goose is a thin harness.** Its job is a unified interface over swappable models. The model does the coding work; Claude and Codex are strong enough to do the rest on their own.

### Evidence — the model matters more than the harness

| Study | Finding |
|---|---|
| Liu, Han — *What Does a Harness Buy? Tokens, Mostly* (arXiv, 2026-10-03) [^tokens] | 447 SWE-bench Verified tasks: heaviest and lightest harness (Claude Code, mini-SWE-agent) "equivalent within five points". Swapping harness changed outcomes about as often as rerunning the same one. "What the harness does decide is the bill" — up to 3× cost per task. |
| Pan et al. — *HarnessTax* (UC Berkeley, Arena Intelligence) [^harnesstax] | 21 model–harness pairs, SWE-bench Lite + Terminal-Bench 2.0. "Harness choice has little effect on task success rate, but can significantly affect the cost." Average harness effect on success within ±2% (SWE-bench Lite) and ~±5% (Terminal-Bench). "A simple harness can be competitive." |
| Brilliantov, Hernández-Cano, Abbé — *How Much of a Harness Does a Strong Agent Need…* (Apple ML, 2026-10) [^apple] | Same backbone, equal time budget: open-source SOTA harnesses no better than a single session of a minimal coding agent — "pointing to the backbone as the primary driver for performance." |

**Interpretation — not a finding of the studies:** models keep improving, and what harnesses used to add gets absorbed into training. None of the three measures this over model generations; they compare harnesses at one point in time.

**Commits:** the agent commits itself, in small atomic commits. goose does not commit unless told to, so the recipe must say so. Today the [issue-to-pr recipe](../../spikes/goose-k8s-prep/recipes/issue-to-pr.yaml) asks for a commit referencing the issue — not yet for atomic commits.

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
| Two harnesses | Laptop and cloud differ. Shared surface is instructions and skills — goose reads `AGENTS.md` and `.agents/skills/` natively ([ADR-011](./011-skills-location.md)). |
| goose's cost overhead unmeasured | All three studies agree the harness drives **cost** (up to 3–5×), mainly via fixed system prompt + tool schemas per call. goose was not among the harnesses tested. |
| goose skills have no per-recipe governance | Extensions are scoped per recipe, skills are not; a skill can derail a headless run. |

## References

[^tokens]: Yangze Liu, Zhongyi Han. *What Does a Harness Buy? Tokens, Mostly.* arXiv:2610.04433, 2026-10-03. https://arxiv.org/abs/2610.04433
[^harnesstax]: Melissa Z. Pan, Shuo Yang, Negar Arabzadeh, Wei-Lin Chiang, Ion Stoica, Matei Zaharia. *HarnessTax: How Much Does the Harness Matter for Coding Agents?* UC Berkeley, Arena Intelligence. https://harnesstax.github.io/
[^apple]: Kirill Brilliantov, Alejandro Hernández-Cano, Emmanuel Abbé. *How Much of a Harness Does a Strong Agent Need for Autonomous ML Engineering?* Apple Machine Learning Research, 2026-10. https://machinelearning.apple.com/research/harness-autonomous-ml-engineering
