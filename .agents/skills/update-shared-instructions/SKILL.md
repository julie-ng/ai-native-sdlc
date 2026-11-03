---
name: update-shared-instructions
description: Distribute the parent repository's shared agent instructions to selected submodules, reconcile their AGENTS.md indexes, surface instruction conflicts, and deliver one pull request per changed repository.
---

# Update shared instructions

The parent repository owns `.agents/shared/*.md`. Submodules receive local copies and retain their project-specific instructions. Run this workflow when asked to distribute or refresh those shared instructions. A request to write or review this skill does not authorize running it.

## Start from the latest origin/main

- Locate the hosting parent checkout through its `.gitmodules` and `.agents/shared/`; do not assume the current directory is the parent.
- If running in a dev container, use `devcontainer-agent-setup` before authenticated Git/GitHub work. Never substitute the human's identity if credentials are unavailable.
- Fetch the parent's `origin/main` and create an isolated source worktree at that fetched commit. Use its `.gitmodules`, shared sources and instructions for preparation, not the hosting checkout's potentially stale or uncommitted contents. Leave the hosting checkout untouched. Use another source ref only when explicitly requested, and record that choice.
- Discover submodule paths and remotes from that source worktree's `.gitmodules`. Use the user's selected targets; if none are specified, target all listed submodules. If the requested repository or PR count differs from the discovered targets, clarify the target set before creating target branches. Never silently exclude a repository to meet a count.
- Inspect existing branches, PRs and worktrees for an unfinished distribution. Report overlaps rather than overwriting another session's work or opening duplicate PRs.
- For each target, fetch `origin/main` and create a new `agent/` task branch in a separate worktree directly from that freshly fetched ref. Do this before inspecting target instructions or analyzing duplication and conflicts. Do not branch from the submodule's pinned commit, current checkout, or another task branch.
- If a submodule is uninitialized, use an isolated clone of its declared remote to fetch `origin/main` and create the task worktree. Do not initialize or switch the parent's submodule checkout merely to distribute instructions.
- Configure the agent identity and signing for each new task worktree before committing. Leave existing submodule checkouts, dirty files and branches untouched. Do not stage or commit parent submodule pointers.
- Only push the task branch and create a PR targeting `main`. Never push, merge or commit directly to `main`, merge the PR, bypass protections, or delete branches as part of this workflow.

## Prepare from the fresh worktrees

- Read the source worktree's `AGENTS.md` and shared instructions. Snapshot its shared Markdown sources once for the whole run and record the source commit so every target receives the same contents. Do not modify the source while distributing it.
- Perform all target instruction inspection, conflict analysis, edits and checks in the newly created target worktrees. Do not use the parent's existing submodule checkouts as the analysis baseline.

## Reconcile instructions and surface conflicts

Read each target's root `AGENTS.md`, nested `AGENTS.md` files, harness stubs and relevant instruction references before editing. Compare both the existing shared copies and project instructions against the source snapshot. Inspect the repository's docs-only verification guidance too.

Classify findings by meaning, not just matching text:

- **Duplication:** compatible shared rules repeated locally. Remove redundant general rules from the root instructions when the shared files replace them; retain project-specific applications and detail.
- **Explicit project exception:** preserve it. Explicit project-specific exceptions override shared defaults; otherwise both apply. Identify the exception and its effect in the PR.
- **Conflict without an explicit exception:** preserve the existing project rule and flag the contradictory clauses for review. Do not silently discard it, reinterpret it as an agreed exception, or change the shared source. Prepare the distribution PR as a draft if the unresolved conflict leaves instructions ambiguous.
- **Stale or broken guidance:** identify obsolete paths, inconsistent branch/identity rules and missing skill references. Fix references directly affected by this distribution; report unrelated problems without expanding scope.

For each conflict or exception, report the repository and file locations, the conflicting instructions, their practical consequence, and what was preserved or changed. State when no conflicts were found. Do not turn differences in technology, commands or domain contracts into conflicts merely because the shared guidance is generic.

## Update the target

- Copy every Markdown file in the source snapshot into the target's `.agents/shared/`, preserving source contents exactly. Do not customize distributed copies; project exceptions belong in project instructions.
- Preserve project-specific reading order, commands, conventions, security restrictions and nested instruction files. Do not distribute the parent's root `AGENTS.md`, skills, memory contents or architecture docs.
- Add or update one `Shared instructions` section at the end of the root `AGENTS.md`. State: “Read and follow these alongside this repo’s project-specific instructions. Explicit project-specific exceptions override shared defaults; otherwise both apply.” Link each copied file with a descriptive label and a repo-relative `./.agents/shared/…` path. Remove duplicate index entries and stale entries for formerly distributed files.
- If root `AGENTS.md` is absent, create it with the shared section and any necessary pointers to existing project guidance. Do not invent project policies or reproduce the parent's project-specific content.
- Preserve unrelated files in the target's `.agents/shared/`. If an old distributed file has no source counterpart, report it as a removal candidate; do not delete it without established provenance and clear replacement intent.
- Check whether ignore rules prevent tracking the copied files. Add only the narrow exceptions needed for this shared directory. Leave unrelated ignore rules and harness configuration alone.
- Do not delete `.agents/instructions/` or other instruction directories as an incidental cleanup. Their removal requires task scope or a clear file-by-file replacement.

## Verify and deliver

- Confirm every copied file is byte-for-byte identical to the source snapshot, every shared index entry resolves, every source file has one entry, and no stale distributed index entry remains. Check the diff for lost project rules and unintended changes.
- Run `git diff --check` and the target's applicable documentation/guidance checks, including validation of affected instruction links. Report unavailable checks and pre-existing failures; do not fix unrelated application code to make documentation checks pass.
- If no changes are needed, report the target as up to date; do not create an empty commit or PR.
- Commit each coherent target update with the configured agent identity and GPG signing. Before publication, fetch `origin/main` again; if it advanced, rebase onto it, sign rewritten commits, and repeat the affected comparison and checks.
- Push only the task branch. Create one PR per changed target with native `gh`, targeting `main`. Describe the source snapshot, instruction/index changes, conflicts and preserved exceptions, verification, and unresolved issues. An unresolved instruction conflict requires a draft PR, not a silent precedence decision. No additional confirmation is needed for the branch push and PR creation when the user has invoked this distribution workflow.
- If a target is blocked, keep completed work in the others and report the actual failure. Do not claim a PR exists until its URL is returned or verified.
- Finish with one table listing **every selected repository**, its PR link or up-to-date/blocked status, and any conflict requiring the human's attention. Include all PRs together for review and explain any difference from the expected count. Report the parent submodule pointers as unchanged by this workflow.
