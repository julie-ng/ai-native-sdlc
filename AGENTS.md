# AGENTS.md

## About this repo

- Design notes for an autonomous-agent setup. **Documentation, not an app.**
- Mostly markdown. Some Dockerfiles and diagrams.
- Work-in-progress — contents change constantly. Optimize for fast scanning.
- `architecture/` holds design docs, one topic per file. `spikes/` holds narrow experiments.
- **The docs are the memory.** If it matters and isn't written down, it didn't happen. Err toward writing it down.

## Working mode and reading order

- Default to an interactive session with the human architect. Follow the prompt; when the intended direction is unclear, ask rather than inventing a task or design decision. An explicit task or GitHub issue defines the scope for independent work.
- Read the [architecture index](./architecture/README.md), then the [ADR index](./architecture/decisions/README.md), then the design docs and ADRs relevant to the prompt.
- Design docs describe the evolving design and current state; ADRs record decisions and their reasoning. If they disagree, flag the discrepancy to the architect rather than silently choosing which to follow.
- Build and update the design with the architect as learnings emerge. Record agreed changes and their reasoning in the relevant docs as the session progresses; distinguish proposals from agreed decisions and verified findings.

## Cross-session memory

- At session start, read the project's `MEMORY.md` index and any linked memory files relevant to the task.
- In the dev container, Claude Markdown memory files are persisted through a mount. Consult the local `.devcontainer/devcontainer.json` to locate the mounted Claude directory, then find the project's `projects/<workspace-path-slug>/memory/` directory. In a task worktree, use the original workspace's memory directory.
- All harnesses, including Codex, must explicitly read the mounted Markdown memories. Do not assume they were included in the session context or infer their absence from an empty native memory database.
- Build on the existing Markdown memory system: save reusable learnings and user preferences there, update existing entries when appropriate, and maintain the `MEMORY.md` index. Keep entries harness-agnostic unless a detail is specific to one harness. Coordinate with other sessions before editing shared memory files.
- Memory is a retrieval aid. Repository docs and ADRs remain authoritative; verify remembered technical claims against current sources and flag discrepancies.
- If the memory directory is missing or unreadable, report that limitation and continue with the repository docs.

## Verify, don't guess

- Never state a technical claim you have not checked. Read the file, run the command, fetch the doc.
- **Mark unverified claims in the file itself**, not just in chat — otherwise they become settled fact next session.
- Give the mechanism, not "it's handled."
- Don't invent detail to fill a table cell. An empty cell is honest; a plausible guess is not.
- Prefer primary sources. Note the trust tier when it's not obvious: primary/authoritative vs. secondary vs. don't-cite.
- Ask who else writes a shared resource before concurrency bites.
- **These notes justify a security boundary — wrong details are load-bearing.**

## Security framing

- **Config != boundary.** A mitigation is not a guarantee. Never round one up to the other for a cleaner sentence.
- Only OS-level mechanisms (container, VM, restricted user) claim "boundary." Config-file rules that match command strings are deterrents, not boundaries.
- Before writing "this protects X," ask whether it protects X or merely discourages something.

### Two layers, never conflated

1. **Isolation** — microVMs, containers. Must hold under scrutiny.
2. **Convenience** — session managers, dashboards, worktree UIs. Zero authority to claim isolation it doesn't enforce.

Name which layer a tool operates at. A good answer at layer 2 buys no credibility at layer 1. Flag category errors plainly.

## Writing style

- Succinct. Load-bearing information only. No fluff.
- Full sentences not required. Prefer bullets.
- Keep tables succinct. Drop a row/column that says the same thing in every cell.
- No preamble, no summary-of-what-you-just-read sections.
- Link out instead of restating external docs.
- `> [!NOTE]` / `> [!IMPORTANT]` for callouts. `<details>` for reference material not read every time.
- No hard line breaks mid-paragraph.

## Diagrams

- Read [DESIGN.md](./DESIGN.md) when creating or revising SVG diagrams.
- Use the [julie.io diagram skill](./.agents/skills/julie-io-diagrams/SKILL.md); reusable CSS and reference SVGs live in `images/`.

## Decisions

- Every doc tracking an evolving design gets a decision log: date/context → decision, one row each.
- Write tradeoffs down even once decided — including minor ones. Decisions with the reasoning stripped out are useless later.
- **Don't carry forward unevaluated choices.** If a tool or pattern was inherited rather than chosen, say so rather than presenting it as settled.

## Spikes

- Narrow, stated question — "does *this specific mechanism* work," not "does this work."
- Go/no-go criteria fixed before running, not vibes after.
- Layered: each layer gets its own go/no-go. Don't bundle steps where a failure would be ambiguous about which part broke.
- Partial success is kept. Layer 2 failing doesn't invalidate Layer 1.
- Update the decision log as you go, not at the end.

## Goals vs. current state

"Goals" are targets, not achieved state. Don't flag the gap between a goal and the documented current setup as a contradiction — **the gap is the work.**

## Shared instructions

Read and follow these alongside this repo’s project-specific instructions. Explicit project-specific exceptions override shared defaults; otherwise both apply.

- [Communication](./.agents/shared/communication.md)
- [Git & GitHub workflow](./.agents/shared/github-workflow.md)
