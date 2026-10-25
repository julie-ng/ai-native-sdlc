# ADR-014: Commit signing — native Git with GPG

- **Status:** Accepted — design; cloud key delivery not implemented
- **Date:** 2026-10-25
- **Context:** Cloud committing roles; retain the native Git flow in the dev-container tier.

## Context

The existing design uses native Git + GPG. The GitHub App already needed for broker-issued access ([ADR-012](./012-agent-identity-commits-vs-github-tokens.md)) also supports automatic commit signing, a newly identified alternative evaluated here.

### Requirements

- Agent commits show **Verified** on GitHub without impersonating the human developer.
- Prioritize clean commit history, straightforward rebasing and a shared Git workflow across GitHub and GitLab.

### Mechanism constraint

Installation tokens authenticate Git/API requests; they do not sign local commits. The App authentication key and the GPG commit-signing key serve different purposes.

## Evaluated: GitHub-created App commits

`gh api graphql` can invoke `createCommitOnBranch`: GitHub creates and signs the commit. The web UI is not required.

### Advantages

- No pod GPG-key delivery or maintenance (but the broker's App key remains).
- No local author/signing setup for API-created commits. Bot attribution supports repository analysis.

### Disadvantages

_Sorted by severity (high to low)_

- **History rewriting:** the API appends commits. Rebased replacements need additional signing/publication steps; the push token does not sign them.
- **Forge-specific instructions:** GitHub and GitLab need different publication/signing paths, beyond selecting `gh` versus `glab`.
- **More to debug:** file payloads, expected HEAD, checkout synchronization and history reconstruction become client responsibilities.
- **Role attribution:** one App retains one bot author across token scopes. Separate bot identities require separate Apps.

Evidence and untested workarounds: [research note](../reference/commit-signing-research.md).

## Decision

**Retain native Git with local GPG signing.** Re-sign rewritten commits during local rebases; authenticate pushes with broker-issued tokens.

A new remote signing service is also rejected: it adds infrastructure and API/client work.

### Advantages

- Clean commit history with conventional `git rebase -S` and re-signing.
- One Git workflow across forges, without specialized publication/signing skills.
- Familiar commit/push behavior with fewer synchronization and history-reconstruction paths to debug.

### Role attribution

- **Architect and coder** are the committing roles; both obtain repository/role-scoped broker tokens.
- Set distinct `git user.name` and `git user.email` per role. These are Git metadata, not authentication or separate GitHub accounts.
- Tag roles now for later code-quality/maintainability comparisons across different instructions and skills. The effort is low; the analytical value remains unproven.

GitHub links both roles to the same account in its author labels and aggregates their contributor counts. Role names/emails remain in the Git metadata for analysis; pushing with an App token does not change them. [Account linking](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address), [contributor grouping](https://docs.github.com/en/rest/repos/repos#list-repository-contributors).

> [!IMPORTANT]
> GitHub's **Verified** badge requires the committer email to match the key and a verified email on the account holding its public key. Both roles can share one agent account. [Email/key requirements](https://docs.github.com/en/authentication/managing-commit-signature-verification/associating-an-email-with-your-gpg-key).

Optional: **one long-lived GPG key per role**, reused across runs, distinguishes signing fingerprints. These keys serve signing/verification, not repository authentication or authorization.

### Accepted trade-offs

- Deliver a signing private key to each committing pod and maintain its lifecycle.
- Role labels may share one GitHub profile; commit-level analysis uses Git metadata and, if separated, key fingerprints.

### MVP / POC scope

Dev-container GPG signing exists ([ADR-001](./001-dev-container-agent-identity.md)); cloud key delivery and role configuration remain implementation work. App commits were researched, not integration-tested.

## Open

- Key delivery/rotation; whether to use separate role keys.
- Align workflow/broker permissions with architect/coder attribution; ADR-012 currently lists planner, coder, reviewer and open-PR roles.

## Decision log

| Date | Decision / clarification | Reasoning |
|---|---|---|
| 2026-10-25 | Distinguish role metadata from GitHub account display | Role names/emails remain in commits; GitHub links verified aliases to one account and groups its contributions. |
| 2026-10-25 | Retain native Git + GPG | Clean rebases, portability and less custom behavior to debug. |
| 2026-10-25 | Tag architect/coder; role keys optional | Low-effort data for later quality/maintainability comparisons. |
| 2026-10-25 | Record App signing research | Separate documented behavior from untested workarounds. |
| 2026-10-24 | Evaluate App commits; reject remote signing service | Newly identified App capability; extra signing infrastructure not justified. |

## Reference — evaluated flows and signing caveats

<details>
<summary>Archived comparison, flows and sources</summary>

| Concern | Native Git + GPG | GitHub-created App commits |
|---|---|---|
| Creates / signs the commit | Local Git / GPG key | GitHub via commit API / GitHub |
| Commit identity | Configured Git name/email | Credential-derived App bot |
| Pod credentials | Broker token + signing key | Broker token |
| Local setup | Role metadata and signing configuration | Not needed for the API commit itself |
| Publication | `git push` | File-change request, then checkout synchronization |
| Portability | Shared native Git operations | Forge-specific API workflow |

### Native Git flow

1. Obtain broker token; load signing key and role metadata.
2. Edit, test and create GPG-signed commits.
3. Resolve/rebase as needed, sign replacement commits and push with the token.

### GitHub App flow evaluated

1. Obtain a repository-scoped contents-write token.
2. Supply it to `gh`, for example through `GH_TOKEN`.
3. Clone, edit and test locally.
4. Send branch, expected HEAD, message and file changes to `createCommitOnBranch`.
5. GitHub creates/signs the commit and advances the branch.
6. Synchronize the local checkout with the resulting commit.

### Sources and workarounds

- [Commit API](https://docs.github.com/en/graphql/reference/commits#createcommitonbranch), [CLI API invocation](https://cli.github.com/manual/gh_api): API-created commits derive authorship from the credential; they do not sign existing local commits.
- [Git rebase signing](https://git-scm.com/docs/git-rebase#Documentation/git-rebase.txt---gpg-signkeyid): native Git supports signing replacement commits.
- [GitHub rebase-and-merge caveat](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification#signature-verification-for-rebase-and-merge), [GitLab web/API signing and rebase caveat](https://docs.gitlab.com/user/project/repository/signed_commits/web_commits/): GitHub rebase-and-merge and GitLab UI rebasing do not preserve signatures; the documented workaround is local rebasing. This differs from initial API commit signing.
- [Research: rebasing and conflicts](../reference/commit-signing-research.md#rebasing-and-conflicts): server branch updates or rebuilding signed App history were investigated as proposals, not implemented or verified.
- [Git identity configuration](https://git-scm.com/docs/git-config): names/emails are commit metadata, independent of push authentication.

</details>
