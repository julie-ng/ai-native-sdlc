# Architecture Decision Records

One decision per file, numbered. Accepted ADRs hold the reasoning and stay stable; evolving current state lives in the design docs, which link here.

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
