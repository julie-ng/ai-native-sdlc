# ADR-008: SCM-agnostic tooling — Git and forge CLIs over MCP

- **Status:** Accepted
- **Date:** 2026-10-21
- **Context:** Both tiers. Must work for GitHub and GitLab.

## Context

- The platform must support GitHub and GitLab without a custom abstraction over forge operations.
- Git is shared; forge vocabulary and APIs differ. Agents select `gh` or `glab` for the configured forge.
- Prefer existing command-line tools over an additional MCP tool catalog when they meet the task's needs. Model knowledge of familiar commands and concise instructions are the starting point; an MCP wrapper must justify its token/context and latency overhead.

## Decision

- Use native Git and forge CLIs (`gh`, `glab`) through the shell; do not add MCP servers for these SCM capabilities.
- Let agents choose the matching forge CLI. No SCM command gateway or uniform API is required.
- Keep output compact with selected fields, filters and result limits rather than returning entire API responses.
- CLI selection does not determine access permissions. Authentication and credential scoping remain separate platform responsibilities ([ADR-012](./012-agent-identity-commits-vs-github-tokens.md)).

### Commit creation and signing

Native `git commit` with GPG signing and `git push` remain the accepted path. [ADR-014](./014-commit-signing.md) records the evaluation of App commits and the decision to retain native Git for clean rebases and portability.

The CLI-over-MCP decision does **not itself require** local commit creation: `gh api graphql` can invoke a commit-creation API without MCP. The signing choice is recorded separately in ADR-014.

### Target design

As above. Reuse Git and the appropriate forge CLI rather than building a command abstraction service. The token broker issues credentials; it does not execute forge commands on the agent's behalf.

### MVP / POC scope

- `gh` + plain git, GitHub only.

## Why not MCP?

The expected benefit of a second interface is limited for these familiar developer tools. Published GitHub evaluations support starting with the CLI; they do not establish a universal MCP penalty or measure this platform's agents.

| Evaluation | Reported finding |
|---|---|
| [Arize](https://arize.com/blog/mcp-vs-cli-skills-for-agents-what-our-eval-found-and-which-you-should-use/) — Opus 4.6, 25 GitHub tasks, 500 trials | On the hardest analysis tier, MCP took about **5× longer** and cost **over 6× more** than CLI-with-skills approaches. Overall correctness was similar; MCP won some tasks that matched its tools directly. |
| [ScaleKit](https://www.scalekit.com/blog/mcp-vs-cli-use) — Sonnet 4, five read-only GitHub tasks, 75 runs | Repository metadata/install task: **9,386 CLI tokens vs. 82,835 MCP tokens**, about **8.8×**. Across tasks, reported median token ratios were **4–32×**. |

- Arize's bare-CLI baseline was competitive without a skill; concise guidance improved efficiency. This supports relying on model familiarity with `gh` instead of duplicating its surface as tools.
- ScaleKit's MCP setup exposed 43 tool schemas; schema overhead was a major contributor. Its 72% MCP versus 100% CLI completion rate reflected seven connection timeouts in 25 MCP runs, not a general reliability guarantee for either interface.
- Neither evaluation establishes GitLab CLI performance. Task shape, model, tool exposure, response size and guidance can change the result; short instructions and filtered output still matter.
- The [clifor.ai comparison](https://www.clifor.ai/compare/cli-vs-mcp) reproduces ScaleKit's figures. It is a secondary summary, not an independent benchmark; the original report supports the numbers above.

Sources: Arize and ScaleKit are primary evaluation reports; clifor.ai is linked as the requested secondary comparison. The image-level CLI choice is also recorded in [agent-images ADR-002](../../agent-images/architecture/decisions/002-github-cli.md).

## Alternatives considered

| Option | Disposition |
|---|---|
| MCP servers for SCM operations | Additional tool/context overhead without a demonstrated need beyond the installed CLIs. Revisit if required capabilities or measured results justify them. |
| API-created commits | Evaluated in ADR-014; retain native Git for clean rebases, portability and less custom publication behavior. |

## Consequences

**Positive**

- Reuse familiar tools and the shell interface without an additional SCM tool catalog or command abstraction service.
- Retain a common Git workflow; ADR-014 records the signing rationale.

**Accepted trade-offs**

| Trade-off | Notes |
|---|---|
| Forge-specific CLIs in the image (`gh`, `glab`) | The agent picks the right one; no abstraction layer. |
| Command construction and output handling | Agents must handle flags, exit codes and output; CLI use alone does not guarantee efficiency or correctness. |

## Open

- GitLab's account/key/email matching requirements are documented in the [signing research](../reference/commit-signing-research.md#gitlab-findings); the platform's GitLab runtime configuration remains untested.

## Decision log

| Date | Decision / clarification | Reasoning |
|---|---|---|
| 2026-10-25 | Retain native commit creation after the ADR-014 evaluation | Clean rebases and portability outweigh avoiding GPG-key delivery. |
| 2026-10-24 | Rename ADR around SCM-agnostic CLI use over MCP; add benchmark sources | Makes the intended interface choice discoverable and records the evidence and its limits. |
| 2026-10-24 | Separate the signing question into undecided ADR-014 | CLI use permits API calls; local commit creation is a separate choice. Current signing design remains in force. |
| 2026-10-21 | Native Git plus forge CLIs; no SCM command abstraction | Shared Git workflow with agents choosing the appropriate forge commands. |
