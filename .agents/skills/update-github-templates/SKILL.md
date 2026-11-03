---
name: update-github-templates
description: Sync the parent repository's GitHub issue and pull request templates to selected submodules, report local differences and policy conflicts, and deliver one pull request per changed repository.
---

# Update GitHub templates

The parent repository owns the shared GitHub templates. Distribute them when asked to sync issue or pull request templates to submodules. Writing or reviewing this skill does not authorize running it. Instruction-set distribution remains a separate workflow in `update-shared-instructions`.

## Start from the latest origin/main

- Locate the hosting parent checkout through `.gitmodules`. Read its applicable instructions. In a dev container, use `devcontainer-agent-setup` before authenticated Git/GitHub work; never substitute the human's identity if agent credentials are unavailable.
- Fetch the parent's `origin/main` and create an isolated source worktree at that commit. Read its instructions and discover targets and source templates there, before analyzing target contents. Use another source ref only when explicitly requested, and record that choice.
- Discover target paths and remotes from the source `.gitmodules`. Use the user's selected targets, or all listed submodules if none are specified. Clarify any mismatch between the requested target/PR count and the discovered set before creating target branches.
- Inspect existing worktrees, branches and PRs for overlapping template updates. Report overlaps rather than modifying another session's work or opening duplicate PRs.
- For each target, fetch `origin/main` and create a new `agent/` task branch in a separate worktree from that fetched ref before inspecting templates or making changes. For uninitialized submodules, use an isolated clone of the declared remote; leave the parent's submodule checkouts untouched.
- Configure the agent identity and GPG signing for each task worktree. Never modify protected branches, merge PRs, bypass protections, delete branches, or stage parent submodule pointers in this workflow.

## Snapshot and compare

- Snapshot `.github/pull_request_template.md` and all tracked files under `.github/ISSUE_TEMPLATE/`, including `config.yml`, from the source worktree. Record the source commit and exact file list; use the same snapshot for every target. If an expected source path is missing, report it rather than treating its absence as a deletion instruction.
- Do not copy the entire `.github/` directory. Workflows, permissions, CODEOWNERS, repository settings and unrelated files are outside scope.
- In each fresh target worktree, read applicable `AGENTS.md` files and documentation-only verification guidance. Inspect existing issue templates, their configuration, and PR templates, including alternate names, locations and template directories. Surface competing templates rather than assuming copying one file replaces all existing entry points.
- Compare meaning as well as bytes. Identify target-specific fields, checklist requirements, labels, assignees, contact links, blank-issue settings, and project-specific references that would change or be lost.
- In the PR, distinguish routine template refreshes from project-policy conflicts. For each conflict or local exception, show the file locations, relevant clauses/settings, practical effect, and proposed replacement. State explicitly if no conflicts were found. Do not silently decide that a local requirement is obsolete.

## Copy and verify

- Copy the source snapshot to the same relative paths in the target, preserving contents byte-for-byte. Canonical replacements belong on the task branch for review; report overwritten project-specific requirements. If their intended replacement is unclear, make the PR a draft and highlight the unresolved decision.
- Preserve unrelated and target-only templates and configuration. Report obsolete or competing files as removal candidates; do not delete them merely because they are absent from the source. Do not edit `AGENTS.md`, shared instructions, application code or workflows as incidental cleanup.
- Check links and project-specific references in the copied files. If a source reference is not portable, report it rather than silently customizing a distributed copy or changing the source during the run.
- Check that copied paths are tracked; if necessary, add only narrow ignore exceptions for those paths.
- Verify byte-for-byte equality for every copied file, parse YAML and Markdown frontmatter where applicable, and run `git diff --check` plus relevant repository documentation/guidance checks. Check that local labels or assignees referenced by templates exist when authenticated inspection is available; report unavailable validation rather than creating labels or changing membership.
- If no changes are needed, report the target as up to date; do not create empty commits or PRs. If a target is blocked, report the actual failure and retain completed work for other targets.

## Commit and deliver

- Create a signed Conventional Commit for each target's template update. Fetch `origin/main` again before publication; if it advanced, rebase onto it, sign rewritten commits, and repeat affected comparisons and checks.
- Push only the task branch and create one PR per changed target with native `gh`, targeting `main`. Use the canonical PR template for the body, populated with the source commit, copied files, verification and conflicts. Use a draft PR for unresolved policy conflicts. Invoking this distribution workflow authorizes its task-branch pushes and PR creation; never merge the PRs.
- Verify the returned PR URLs, bases and changed-file lists. Finish with one table covering every selected repository: PR link or up-to-date/blocked status, and conflicts requiring the human's attention. Include all PRs together for review and explain any difference from the expected count.
- Report the parent sources, submodule checkouts and gitlink pointers as unchanged by the distribution run. Do not claim GitHub UI behavior was tested merely because local file checks passed.
