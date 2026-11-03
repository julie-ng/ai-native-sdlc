---
name: update-shared-instructions
description: Sync parent-owned agent instructions to selected submodules, migrate duplicated guidance when needed, resolve routine differences, and deliver concise review PRs.
---

# Update shared instructions

Distribute `.agents/shared/*.md` from this parent repo; retain each target’s project-specific instructions. Writing or reviewing this skill does not run it. When templates are also requested, coordinate with `update-github-templates` on one owned branch, worktree and PR per target.

## Prepare once

- Read applicable instructions once. In a dev container, use `devcontainer-agent-setup` for authenticated Git/GitHub work and configure signed agent commits in each task worktree; never substitute a human identity.
- Fetch the parent's `origin/main` and use an isolated source worktree at that commit. Use another source ref only when the user requests it, including an explicit pre-merge test. Record the source commit and use that fixed snapshot for every target.
- Discover targets from that source’s `.gitmodules`; use the selected subset or all submodules if none is specified. Clarify genuinely ambiguous target selection; do not ask again about a set already established in the session.
- Check for overlapping work once. Create each new `agent/` task branch in an isolated worktree from freshly fetched target `origin/main`, before inspecting target content. Reuse an owned, open sync branch when continuing the same task; never reuse a merged branch. Fetch and rebase a continuing branch if main advanced.
- For uninitialized submodules, use an isolated clone. Verify `git rev-parse --show-toplevel` is the intended worktree; fix inherited `core.worktree` only in that new worktree if necessary. Leave existing checkouts and parent gitlink pointers untouched.
- Batch independent reads across targets. Do not repeatedly rediscover source files, reread unchanged instructions, or rerun setup during a combined sync.

## Choose the amount of review

- **Initial migration:** if shared copies or the root index are absent, read root instructions and directly relevant references; remove compatible duplicated general rules while retaining project-specific commands, conventions, restrictions and attribution requirements. Read nested instructions only when applicable to the affected scope or required by repository guidance; do not audit the whole project.
- **Routine refresh:** compare the existing shared copies with the source first. Review changed rules against affected local instructions; do not repeat the initial consolidation or reopen settled decisions. If copies and index already match and no requested migration remains, report up to date without a commit or PR.

## Resolve differences using judgment

- Apply explicit session decisions without asking the user to repeat them. Remove superseded generic rules and fix references directly affected by the sync. For example, an explicitly required Git setup skill supersedes an old generic “do not require personal skills” sentence; that is cleanup, not an open policy decision.
- Preserve genuine project-specific exceptions; explicit exceptions override shared defaults, otherwise both apply. Do not infer new exceptions from accidentally broad or stale wording.
- Escalate only consequential choices that remain unresolved after consulting the current instructions and session decisions: e.g. widening access, rewriting another contributor’s branch, or weakening an intentional project restriction. Preserve the disputed rule for review and state the actual decision needed in one sentence.
- Do not silently expand authorization or remove project-specific security restrictions. Do not classify different technologies, commands or implementation details as conflicts merely because the shared rules are generic.

## Copy and reconcile

Use the bundled helper for deterministic copying and root-index updates:

```sh
node scripts/sync.mjs SOURCE_ROOT TARGET_ROOT
```

Resolve `scripts/sync.mjs` relative to this skill’s directory. The helper copies every source Markdown file byte-for-byte, uses the source root index’s labels, and creates or updates the final shared section. It preserves other root sections and target-only shared files. It does not reconcile policies, delete obsolete files, stage changes, or operate Git.

- Make any required semantic cleanup in target root instructions separately. Preserve nested files, harness stubs, skills and unrelated content. Do not copy the parent's project-specific root instructions or memory contents.
- Remove obsolete distributed files only when provenance and replacement intent are established; otherwise mention the removal candidate briefly. Add narrow ignore exceptions only if required. Do not delete instruction directories as incidental cleanup.

## Verify once and deliver

- After the final edits, run the helper with `--check`, validate affected local links, inspect the diff for lost project rules, and run `git diff --check` plus required documentation checks. The helper verifies exact source copies and the canonical index. Repeat affected checks only after relevant edits, a failure, or a rebase changes the result.
- Commit coherent changes with the agent identity and GPG signing. Refetch target `origin/main` before publication; rebase and sign replacements only if needed. Push only the task branch and create or update one PR targeting `main`; never merge, change protections, delete branches, or commit parent gitlink updates.
- Use the repo PR template with short entries: what changed, checks performed, and decisions still needed. One sentence per conflict; do not narrate the reconciliation process or repeat every preserved rule. Use a draft only when an unresolved consequential decision blocks readiness, not for routine cleanup or a documented unavailable check.
- Invoking this workflow authorizes its task-branch pushes and PR creation. Continue unaffected targets if one is blocked; report the actual failure without fixing unrelated code.
- Verify PR URLs, bases and file scope once. Finish with one compact table of all selected targets, PR/up-to-date/blocked status, and unresolved decisions. Report existing checkouts and gitlink pointers as unchanged by the run.
