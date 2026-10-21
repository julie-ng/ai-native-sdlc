# 03 · Requirements — features of an AI-native SDLC platform

Coding agents are everywhere, yet measured productivity gains have been modest.[^metr][^cepr] The next order of magnitude doesn't come from more agents on more laptops. It needs a platform that's customizable for a team's specific workflow.

| Area | Requirement | Challenge | Solution |
|---|---|---|---|
| Infrastructure | **Scale** | A laptop runs 4–5 sessions; subscription-based harnesses in VMs scale per seat, not per task. | Kubernetes schedules one pod per task on node pools that grow with demand. |
| Infrastructure | **Reliability** | VMs and stateful runners pin each session to one machine; a failed host takes the work down. | Kubernetes primitives: failed containers restart, pods reschedule onto healthy nodes, retries with a backoff limit. |
| Security | **Isolation** | Agents read beyond the repository they work on. | One clean container per task, with only the repository mounted. |
| Security | **Least privilege** | Agents run with a developer's long-lived credentials. | A token broker issues each agent a short-lived GitHub token, downscoped to its role and one repository. Agents hold no cloud credentials. |
| Data | **State** | Retries and intermediate output flood issues and pull requests. | A system of record — artifact service plus database — tracks starts, retries and runtime. GitHub only sees the result. |
| Interoperability | **Harness-agnostic** | The platform gets locked to one coding agent. | goose as one unified interface — a thin harness: model providers via API, or Claude Code and Codex via ACP. |
| Platform | **Extensibility** | Each team or client needs a different coding loop; hard-coded pipelines get rebuilt every time. | Declarative Argo workflows define each loop in YAML from shared templates. |
| Governance | **Foundation-backed open source** | Vendor lock-in and licensing risk. | Built on CNCF and AAIF projects. |
| FinOps | **Cost efficiency** | Sub-agents inherit the parent session's flagship model — at least twice the price of a mid-tier model.[^pricing] | Models sized to the task, token usage recorded per task to estimate cost. |
| Operations | **Visibility** | A stuck or crashed agent is invisible if reporting depends on it reaching GitHub. | Agents report step status and artifacts to platform services, independent of GitHub. |

A platform lets each kind of work run its own loop — a bug fix on a mid-tier model, a spike on a flagship — and lets an organization standardize proven loops across teams.

Next: [04 · Workflow](./04-workflow.md)

[^metr]: METR — Becker, Rush, Barnes, Rein (July 2025): experienced open-source developers took 19% longer with AI tools, while believing they were 20% faster.
[^cepr]: CEPR VoxEU — Demirer, Musolff, Yang (June 2026): across more than 100,000 GitHub developers, autonomous coding agents nearly tripled commits, but shipped releases rose only ~30%.
[^pricing]: List prices per million tokens (input / output), fetched 10 October 2026: Anthropic Opus 5.5 $4 / $20 vs. Sonnet 5.5 $2 / $10 (2×); OpenAI GPT-6 Astra $10 / $50 vs. GPT-6.1 Sol $2 / $10 (5×).
