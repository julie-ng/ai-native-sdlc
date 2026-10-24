# ADR-014: Commit signing — local GPG vs. GitHub-created App commits

- **Status:** Undecided
- **Date:** 2026-10-24
- **Context:** Commit creation, attribution and signing for cloud agents; implications for the dev-container tier.

## Context

- Agent commits must show **Verified** on GitHub and must not impersonate the human developer.
- [ADR-008](./008-scm-agnostic-cli-over-mcp.md) currently requires native Git commits with local GPG signing. [ADR-012](./012-agent-identity-commits-vs-github-tokens.md) combines that with broker-issued GitHub App installation tokens for access.
- The original intent behind choosing forge CLIs was to avoid MCP and its additional tool/context cost. Using a CLI and creating commits locally are separate choices: `gh api graphql` can create commits through GitHub's API without MCP.
- An installation token authenticates requests; it does not supply a key or automatically sign locally created commits. The broker's App private key authenticates the App; it is separate from the agent user's GPG signing key.

## Decision

**Undecided:** retain local GPG signing or use GitHub-created App commits for cloud agents.

Remote signing through a new signing service is **rejected**: it adds infrastructure, a signing API and client integration to build and operate.

### MVP / POC scope

This ADR captures the comparison; it does not authorize a runtime change. ADR-008 and ADR-012 remain the accepted design pending a decision. Selecting App commits would require revising their native-commit requirement and the corresponding agent instructions.

## Alternatives considered

| Concern | Native Git + local GPG | GitHub-created App commits |
|---|---|---|
| Creates the commit | Local `git commit` | GitHub through `createCommitOnBranch`, invoked with `gh` |
| Signs it | Agent user's GPG private key | GitHub |
| Commit identity | Configured Git author/committer name and email | App bot author derived from the installation token; GitHub supplies committer metadata |
| Credentials in committing pod | Broker-issued token and separate GPG private key | Broker-issued token; no local commit-signing key |
| Local identity setup | Git name, email and signing configuration | Not needed for API-created commits |
| Publication | `git push` | Submit file changes; API creates the commit and updates the branch |
| Working process | Conventional local commits and Git history operations | Construct API payload, handle expected branch HEAD, synchronize local checkout |
| Forge portability | Same native Git commit path | Forge-specific commit API and signing behavior |

### Native Git flow

The platform supplies the agent user's GPG private key to the committing pod and configures Git identity/signing. The agent edits and tests locally, creates a signed commit, then pushes using the broker-issued installation token. Signing-key delivery into cloud pods remains undesigned.

### GitHub App commit flow

1. The coder obtains a repository-scoped, contents-write installation token from the broker.
2. It supplies that token to `gh`, for example through runtime `GH_TOKEN`.
3. It clones, edits and tests locally.
4. It invokes `createCommitOnBranch`, supplying the existing branch, expected current commit SHA, commit message and file changes.
5. GitHub creates the signed commit and advances the branch.
6. The agent synchronizes its local checkout with that remote commit.

`gh api graphql --input commit-request.json` can send the mutation and its variables. A blanket instruction to “use gh” is insufficient: `git push` and `gh pr create` do not invoke this commit-creation path. The API creates a new commit from supplied changes; it does not sign an existing local commit. [CLI API support](https://cli.github.com/manual/gh_api), [CLI authentication](https://cli.github.com/manual/gh_help_environment), [commit mutation](https://docs.github.com/en/graphql/reference/commits#createcommitonbranch).

GitHub documents automatic signing **where supported**. Bot verification requires authenticated App/bot requests without custom author, committer or signature information. The project's App-token flow is **not yet tested**. [Bot signature verification](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification#signature-verification-for-bots).

## Configuring `git user.name` and `git user.email`

### Native Git + local GPG

- Set `user.name` and `user.email` to the agent user's commit identity. These fields identify the author/committer; they do not authenticate GitHub access.
- Set `user.signingkey` to the agent's signing key and `commit.gpgsign=true`; make the corresponding private key available to GPG.
- Register the public key with the agent's GitHub account. The committer email must match an email on the GPG key and a verified email on the account.
- Scope configuration to the isolated pod's repository, or the agent's worktree in a shared checkout. Do not change the human developer's shared identity configuration.

Sources: [Git identity/signing configuration](https://git-scm.com/docs/git-config), [GPG email matching](https://docs.github.com/en/authentication/managing-commit-signature-verification/associating-an-email-with-your-gpg-key).

### GitHub-created App commits

Local `user.name`, `user.email` and GPG configuration do not determine API-created commits. GitHub derives the author from the installation token; a separate cloud-agent user account is not needed solely for this path. The mutation does not accept custom author/committer metadata. [Authorship contract](https://docs.github.com/en/graphql/reference/commits#createcommitonbranch).

Dev-container agents could retain their existing native Git configuration while cloud agents use App commits. That split remains an option, not a decision.

## Consequences to evaluate

- **Local GPG:** conventional Git workflow and forge portability, at the cost of delivering and managing a signing private key in committing pods. Possession permits signing commits as that agent user; it does not itself grant repository access.
- **App commits:** removes pod GPG-key delivery and local author configuration, at the cost of forge-specific publication, request construction and local-checkout synchronization. The long-lived App authentication key still remains in the broker.
- A small helper could package the API publication steps, but no helper has been selected or built. CLI use alone does not establish that this path needs fewer instructions or tokens.
- Signing does not grant repository permissions or bypass branch rules. A read-only reviewer token does not gain commit authority by using `gh`.

## Open

- Which mechanism should cloud agents use? Should dev-container agents retain a different mechanism?
- For App commits, how should agents package changes and reconcile their checkout? Do supported file changes and history operations cover the intended coding workflow?
- For both local GPG and App commits, can the reviewer and coder be distinguished in commit attribution and signing identity? Would that require separate user accounts, signing keys or App identities?
- For App commits, does the workflow handle rebasing and conflict resolution cleanly when an agent picks up an issue against an advanced base branch or updates a PR after later review? How are rewritten commits signed and the local checkout kept consistent?
- GitLab API signing behavior has not been evaluated; GitHub findings do not establish an equivalent path there.

## Verification

- Local agent GPG signing is already used in the dev-container tier ([ADR-001](./001-dev-container-agent-identity.md)); cloud signing-key delivery is not designed.
- **Unverified in this project:** App-token commit creation, App author attribution, Verified status and local-checkout synchronization. A narrow test should establish these before selecting that route.

## Decision log

| Date | Decision / clarification | Reasoning |
|---|---|---|
| 2026-10-24 | Keep cloud commit-signing choice undecided | Preserve the comparison before changing ADR-008/012. |
| 2026-10-24 | Reject a new remote signing service | Additional infrastructure and API/client work are not justified. |
| 2026-10-24 | Separate CLI-over-MCP choice from commit-creation mechanism | `gh` can invoke GitHub's commit API without MCP. |
