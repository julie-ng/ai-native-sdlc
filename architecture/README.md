# Architecture

How the platform works — unsupervised coding agents taking a scoped issue to a reviewed pull request. Read in order:

1. [Use case](./01-use-case.md) — agents read beyond the repo, dev containers don't scale, pair locally and delegate to the cloud. Isolation levels.
2. [Architecture](./02-architecture.md) — Kubernetes architecture, workflow sequence, short-lived credentials, runs on any cloud, design decisions
3. [Requirements](./03-requirements.md) — features of an AI-native SDLC platform, challenge → solution
4. [Workflow](./04-workflow.md) — any bounded loop maps to a DAG, stop conditions, example WorkflowTemplate

**Decisions:** [ADRs](./decisions/) — one per file, target design vs. what the POC builds.

## Reference

Deep dives, linked from the pages above.

- [Identity](./reference/identity.md) — agent vs. me: access vs. attribution, both tiers
- [GitHub configuration](./reference/github-configuration.md) — rulesets, environment-only secrets; no indirect path to credentials or production
- [Token broker](./reference/token-broker.md) — just-in-time, downscoped GitHub tokens for agent pods
- [goose](./reference/goose.md) — the thin harness: provider config, invocation
- [Dev container](./reference/dev-container.md) — laptop tier: setup and mounts
- [Cost and sizing](./reference/cost-and-sizing.md) — target scale to zero; POC min-one pools, cluster start/stop and provisional agent resource budgets
