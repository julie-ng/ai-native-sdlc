# Architecture Decision Records

One decision per file, numbered. Accepted ADRs hold the reasoning and stay stable; evolving current state lives in the design docs, which link here.

Written in role terms ("the human developer"), not first person.

Sections:

- Status · Date · Context (where it applies)
- Context
- Decision
  - **Target design** — best practice, where this is going
  - **MVP / POC scope** — what is actually built, and what it deliberately skips
- Alternatives considered
- Consequences — positive, accepted trade-offs
- Open
- Verification

| ADR | Decision | Status |
|---|---|---|
| [001](./001-dev-container-agent-identity.md) | Dev container agent identity — own account, classic PAT, GPG signing | Accepted |
| [002](./002-isolation-levels.md) | Isolation levels — settings, dev container, K8s pod | Accepted |
| [003](./003-platform-services-vs-agent-pods.md) | Platform services vs. agent pods — trust split | Accepted — design, not built |
| [004](./004-orchestration-argo-workflows.md) | Orchestration — Argo Workflows, one pod per agent step | Accepted — design, not built |
| [005](./005-state-and-artifacts.md) | State and artifacts — workflow service DB + artifact service | Accepted — design, not built |
| [006](./006-models-and-llm-access.md) | Models and LLM access — subscription on the laptop, API keys in the cloud | Accepted |
| [007](./007-harness.md) | Harness — goose in the cloud, Claude Code / Codex on the laptop | Accepted |
| [008](./008-scm-agnostic-native-git.md) | SCM-agnostic — native git, forge CLI only for forge objects | Accepted |
| [009](./009-stop-conditions.md) | Stop conditions — cap, green, human | Accepted — design, not built |
| [010](./010-agent-images.md) | Agent images — official goose base, skills baked, one image per role | Accepted — base pending measurement |
| [011](./011-skills-location.md) | Skills location — `.agents/skills/`, symlinked for Claude Code | Accepted |
| [012](./012-cloud-agent-identity.md) | Cloud agent identity — agent user commits, GitHub App token pushes | Accepted — design only, not implemented or verified |
