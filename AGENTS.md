# AGENTS.md

Rules for any agent working in this repo, regardless of harness or model.

> [!NOTE]
> **This is the single source of truth.** [CLAUDE.md](./CLAUDE.md) is a stub
> that imports this file via `@AGENTS.md`. Harness-agnostic by design — the repo
> is tested against goose and multiple model providers, so rules live here and
> only Claude-Code-specific additions belong in CLAUDE.md.

## Git & GitHub Configuration

If running from inside a dev container:

- Load the agent environment file mounted read-only by the local `devcontainer.json` and follow its instructions. Consult that file for mount paths; do not add them to documentation.
- Set repository-local Git `user.name` and `user.email` from `GIT_USER_NAME` and `GIT_USER_EMAIL`.
- Import the private GPG key mounted read-only by the local `devcontainer.json` into GPG, configure repository-local `user.signingkey` and `commit.gpgsign=true`, and sign all commits.
- Authenticate as `GITHUB_USERNAME` using `GITHUB_PAT`. For `gh`, export `GH_TOKEN="$GITHUB_PAT"`; use `gh auth setup-git` for HTTPS Git authentication.
- Codex or Claude `Co-authored-by:` trailers are allowed; include the model name and version (e.g., Sol 6.1 or Sonnet 5.5). Keep the configured agent as author.
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

- Work on a task branch prefixed with `agent/` (for example, `agent/update-branch-guidance`). Never edit or commit directly on `main`, push to `main`, or merge into it.
- Use a separate worktree when another agent is working in the repository. Do not modify another agent's checkout or task branch.
- Creating task branches and separate worktrees is authorized. In the dev container, using the configured agent identity, signed commits and normal (non-force) pushes of task changes to the agent's own `agent/` branch are also authorized without further user confirmation.
- Request sandbox escalation when these authorized operations require it; use the harness's approval mechanism without asking the user to repeat this authorization. Repository instructions do not override harness-enforced restrictions.
- Never delete branches outside `agent/`. Ask before deleting any `agent/` branch, locally or remotely; permission to manage these branches is not standing approval to delete them.
- Commit completed, coherent changes at meaningful checkpoints without waiting for the user to ask. During interactive sessions, commit before switching tasks or handing back completed work; do not commit every conversational edit or leave completed changes uncommitted by default.
- Amend or squash the agent's own unpushed task commits when it improves the history, preserving all task changes. This is authorized without further confirmation; do not rewrite another agent's commits or published history.
- Push at review-ready milestones, handoffs, or session end when the task changes are coherent; do not push every intermediate commit. Local commits are checkpoints, not a remote backup. Report whether changes are uncommitted, committed locally, or pushed, and explain any deferred push.
- Ask before destructive or hard-to-reverse actions, including force pushes and rewriting published history. The permission to tidy the agent's own unpushed commits above is the limited exception.
- Prefer small, atomic commits with Conventional Commits messages (`type(scope): description`).
- Never commit secrets, tokens, or keys. Provider keys arrive at runtime.
