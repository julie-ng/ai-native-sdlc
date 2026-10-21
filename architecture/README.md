# Architecture

How the platform works — unsupervised coding agents taking a scoped issue to a reviewed pull request. Read in order:

| | |
|---|---|
| [01 · Use case](./01-use-case.md) | Why: agents read beyond the repo, dev containers don't scale, pair locally and delegate to the cloud. Isolation levels. |
| [02 · Architecture](./02-architecture.md) | Kubernetes architecture, workflow sequence, short-lived credentials, runs on any cloud, design decisions |
| [03 · Requirements](./03-requirements.md) | Features of an AI-native SDLC platform — challenge → solution |
| [04 · Workflow](./04-workflow.md) | Any bounded loop maps to a DAG, stop conditions, example WorkflowTemplate |

**Decisions:** [ADRs](./decisions/) — one per file, target design vs. what the POC builds.

## Reference

Deep dives, linked from the pages above.

| | |
|---|---|
| [Identity](./reference/identity.md) | Agent vs. me — access vs. attribution, both tiers |
| [GitHub configuration](./reference/github-configuration.md) | Rulesets, environment-only secrets — no indirect path to credentials or production |
| [Token broker](./reference/token-broker.md) | Just-in-time, downscoped GitHub tokens for agent pods |
| [goose](./reference/goose.md) | The thin harness — provider config, invocation |
| [Dev container](./reference/dev-container.md) | Laptop tier — setup and mounts |
