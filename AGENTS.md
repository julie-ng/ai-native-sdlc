# AGENTS.md

Rules for any agent working in this repo, regardless of harness or model.

> [!NOTE]
> **This is the single source of truth.** [CLAUDE.md](./CLAUDE.md) is a stub
> that imports this file via `@AGENTS.md`. Harness-agnostic by design — the repo
> is tested against goose and multiple model providers, so rules live here and
> only Claude-Code-specific additions belong in CLAUDE.md.

## Git & GitHub Configuration

- Codex must not use GitHub MCP tools or the GitHub connector. This restriction does not apply to other MCP tools or connectors. Use native `git` for repository operations and `gh`, authenticated as the configured agent, for GitHub issues, pull requests, and reviews ([ADR-008](./architecture/decisions/008-scm-agnostic-native-git.md)).

If running from inside a dev container:

- Load the agent environment file mounted read-only by the local `devcontainer.json` and follow its instructions. Consult that file for mount paths; do not add them to documentation.
- Import the mounted agent GPG key. The human's private signing key is unavailable to agents.
- For each agent worktree, confirm `extensions.worktreeConfig=true`, then use `git config --worktree` to set `user.name` / `user.email` from `GIT_USER_NAME` / `GIT_USER_EMAIL`, `user.signingkey` to the agent key fingerprint, and `commit.gpgsign=true`. Check the effective settings once after setup. Leave the human's shared identity settings unchanged.
- `dubious ownership` in the shared checkout reflects host/container user ownership differences. Trust this known repo with `git -c safe.directory="$PWD" ...` or add its exact path to global [`safe.directory`](https://git-scm.com/docs/git-config#Documentation/git-config.txt-safedirectory).
- Authenticate as `GITHUB_USERNAME` using `GITHUB_PAT`. For `gh`, export `GH_TOKEN="$GITHUB_PAT"`; use `gh auth setup-git` for HTTPS Git authentication.
- Keep the configured agent as commit author. Claude `Co-Authored-By:` trailers are allowed; include model name and version (e.g., Sonnet 5.5). Codex trailers are required, e.g., `Co-Authored-By: Codex 6.1 Sol <codex@users.noreply.github.com>`.
- Never copy credential values into documentation or commit them.

## About this repo

- Design notes for an autonomous-agent setup. **Documentation, not an app.**
- Mostly markdown. Some Dockerfiles and diagrams.
- Work-in-progress — contents change constantly. Optimize for fast scanning.
- `architecture/` holds design docs, one topic per file. `spikes/` holds
  narrow experiments.
- **The docs are the memory.** If it matters and isn't written down, it didn't
  happen. Err toward writing it down.

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

- Never state a technical claim you have not checked. Read the file, run the
  command, fetch the doc.
- **Mark unverified claims in the file itself**, not just in chat — otherwise
  they become settled fact next session.
- Give the mechanism, not "it's handled."
- Don't invent detail to fill a table cell. An empty cell is honest; a
  plausible guess is not.
- Prefer primary sources. Note the trust tier when it's not obvious:
  primary/authoritative vs. secondary vs. don't-cite.
- Ask who else writes a shared resource before concurrency bites.
- **These notes justify a security boundary — wrong details are load-bearing.**

## Security framing

- **Config != boundary.** A mitigation is not a guarantee. Never round one up
  to the other for a cleaner sentence.
- Only OS-level mechanisms (container, VM, restricted user) claim "boundary."
  Config-file rules that match command strings are deterrents, not boundaries.
- Before writing "this protects X," ask whether it protects X or merely
  discourages something.

### Two layers, never conflated

1. **Isolation** — microVMs, containers. Must hold under scrutiny.
2. **Convenience** — session managers, dashboards, worktree UIs. Zero
   authority to claim isolation it doesn't enforce.

Name which layer a tool operates at. A good answer at layer 2 buys no
credibility at layer 1. Flag category errors plainly.

## Writing style

- Succinct. Load-bearing information only. No fluff.
- Full sentences not required. Prefer bullets.
- Keep tables succinct. Drop a row/column that says the same thing in every cell.
- No preamble, no summary-of-what-you-just-read sections.
- Link out instead of restating external docs.
- `> [!NOTE]` / `> [!IMPORTANT]` for callouts. `<details>` for reference
  material not read every time.
- No hard line breaks mid-paragraph.

## Diagrams

- Read [DESIGN.md](./DESIGN.md) when creating or revising SVG diagrams.
- Use the [julie.io diagram skill](./.agents/skills/julie-io-diagrams/SKILL.md); reusable CSS and reference SVGs live in `images/`.

## Decisions

- Every doc tracking an evolving design gets a decision log: date/context →
  decision, one row each.
- Write tradeoffs down even once decided — including minor ones. Decisions with
  the reasoning stripped out are useless later.
- **Don't carry forward unevaluated choices.** If a tool or pattern was
  inherited rather than chosen, say so rather than presenting it as settled.

## Spikes

- Narrow, stated question — "does *this specific mechanism* work," not "does
  this work."
- Go/no-go criteria fixed before running, not vibes after.
- Layered: each layer gets its own go/no-go. Don't bundle steps where a failure
  would be ambiguous about which part broke.
- Partial success is kept. Layer 2 failing doesn't invalidate Layer 1.
- Update the decision log as you go, not at the end.

## Goals vs. current state

"Goals" are targets, not achieved state. Don't flag the gap between a goal and
the documented current setup as a contradiction — **the gap is the work.**

## Communication

- Lead with the correction, not a re-derivation of the whole model.
- Don't recap tool calls the user just watched execute.
- Report failures plainly, with the actual output.
- Flag adjacent problems found along the way; do not fix them unasked.
- Say explicitly what was left out and why.
- Check whether the answer is already in the repo before asking.

## Changes

### Security and authorization

- Never edit or commit directly on `main` or another protected branch, push to it, or merge into it. Do not change or bypass branch protections. [GitHub rulesets](./architecture/reference/github-configuration.md#controls) provide additional server-side enforcement; they do not grant permission.
- Creating task branches and worktrees is authorized. In the configured dev container, signed commits and normal pushes of task changes to the agent's own branch are authorized without further confirmation. Session-specific instructions about pushing take precedence.
- Amends, rebases, squashes, force pushes, and rewriting published history on the agent's own non-protected task branches are allowed and encouraged when they improve history. No additional confirmation is needed. Preserve task changes and use `--force-with-lease` for force pushes; if the lease fails, inspect the remote changes before retrying.
- **Sandbox escalation is pre-authorized for the Git operations allowed here.** Request escalation through the harness when needed, without asking the human to repeat authorization. Repository instructions do not override harness-enforced restrictions.
- Never delete branches outside `agent/`. Ask before deleting any `agent/` branch, locally or remotely; permission to rewrite history is not permission to delete branches.
- Never commit secrets, tokens, or keys. Provider keys arrive at runtime.

### Branch and delivery guidance

- Determine the repository's remote default branch and fetch it before creating a task branch or worktree. Create independent task branches prefixed with `agent/` from that fetched remote branch, not the current checkout or another task branch.
- Target PRs at the repository's default branch. Only stack branches or PRs when explicitly requested; state the dependency before creating them.
- After a prerequisite PR merges, retarget dependent PRs to the default branch and verify their base, commits, and diff before requesting branch cleanup.
- Use a worktree for unattended feature work or when another agent is working in the repository; interactive sessions may use the current checkout when it is not shared. Establish ownership before concurrent writes. Do not modify another agent's checkout or task branch.
- Commit completed, coherent changes at meaningful checkpoints, before handoff or switching tasks, without waiting to be asked. Prefer small, atomic Conventional Commits (`type(scope): description`); do not commit every conversational edit.
- Push at review-ready milestones, handoffs, or session end when authorized; do not push every intermediate commit. Report whether work is uncommitted, committed locally, or pushed, and explain any deferred push.
