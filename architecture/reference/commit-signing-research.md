# Commit signing — research for ADR-014

2026-10-25. Research conducted before the [signing decision in ADR-014](../decisions/014-commit-signing.md). Primary GitHub, Git and GitLab documentation; public GitHub API reads as noted below. No App was registered and no test commits or branches were created. ADR-014 subsequently selected native Git + separate role GPG keys, with manual fingerprint checks of claimed roles; the App workflow proposals below remain archived research.

## Are App commits counted and attributable?

**Yes for repository data and analysis; not through an equivalent personal-user contribution calendar.**

- An installation token identifies a GitHub App bot account. The bot has its own login and numeric/node IDs; it is not an anonymous actor or the human App owner's account. [App vs. machine-user identity](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps#machine-vs-bot-accounts), [Bot schema](https://docs.github.com/en/graphql/reference/apps#bot).
- Commit records retain Git author/committer metadata and linked GitHub actor data. The repository contributors API can report a bot's contribution count. This is distinct from every GitHub dashboard or third-party analytics tool including bots. [Commit API](https://docs.github.com/en/rest/commits/commits), [contributors API](https://docs.github.com/en/rest/repos/repos#list-repository-contributors).
- Live read: `akimon658/dotfiles` returned `dependabot[bot]`, actor ID `49699333`, type `Bot`, with **94 contributions**. Its commit `5dcff17d1e43beb122b5943a359e4a8a808aee5b` returned the same bot author. These are dated observations, not fixed counts or a test of this project's App flow. [Example repository](https://github.com/akimon658/dotfiles), [example commit](https://github.com/akimon658/dotfiles/commit/5dcff17d1e43beb122b5943a359e4a8a808aee5b).
- Live schema inspection confirmed `User.contributionsCollection` exists and `Bot.contributionsCollection` does not. A regular agent-user account retains the personal-profile contribution interface, subject to branch, repository and email eligibility. App authorship does not itself credit that user or the human App owner. [User contributions](https://docs.github.com/en/graphql/reference/users#user), [profile criteria](https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference).

For later analysis, **proposed**: retain repository, actor ID/login, run/step/attempt, PR and commit SHA associations in workflow state. Distinguish authored commits, rewritten commits, merged changes and reviews; rebases/squashes alter SHAs and commit counts. Actor identity alone does not identify a workflow role or model.

<details>
<summary>Observed query behavior</summary>

Commit search with `author:dependabot[bot]` found the example above. Repository commit listing with its SHA and exact author email (`49699333+dependabot[bot]@users.noreply.github.com`) also returned it. The equivalent repository-listing filter by bot login returned an empty list, despite the matching commit. Do not assume all username filters handle bots identically; email filtering or collecting records and grouping by actor ID are available approaches. Pagination, branch coverage and the selected analytics product still need validation. The example commit's verification flag was false; it establishes attribution/queryability, not automatic signing of every bot commit.

</details>

## Can coder and reviewer identities be distinguished?

| Configuration | Commit attribution | Signing distinction |
|---|---|---|
| One user account and one GPG key | Same account | No role distinction from the key |
| One user account, separate role GPG keys | Same account | Key fingerprints can distinguish the role-associated keys |
| Separate user accounts and GPG keys | Separate account identities | Separate keys |
| One App, differently scoped installation tokens | Same App bot | Token permissions do not create separate signing identities |
| Separate Apps for roles | Separate App bot identities | GitHub supplies signatures; separate bot authors do not imply separate role-owned GPG keys |

The GPG rows follow from multiple registered keys and local key selection; mapping a fingerprint to a role is platform policy, not a GitHub role assertion. Changing only `user.name` or a message label does not establish a different signing authority. [GPG key management](https://docs.github.com/en/rest/users/gpg-keys), [Git identity/key configuration](https://git-scm.com/docs/git-config).

### Git metadata versus GitHub's displayed account

With `goose+architect@julie.io` and `goose+coder@julie.io` both verified on `julieio-goose`, native commits retain their configured names (`goose (architect)` / `goose (coder)`) and emails. GitHub associates both authors with `julieio-goose` through those emails; contributor counts are grouped by account across its addresses. This mapping is distinct from GPG verification and the App identity authenticating the push. Both role keys must be registered and satisfy committer-email matching for Verified signatures. [Git names](https://docs.github.com/en/get-started/git-basics/setting-your-username-in-git), [email-based linking](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address), [contributor grouping](https://docs.github.com/en/rest/repos/repos#list-repository-contributors), [GPG email matching](https://docs.github.com/en/authentication/managing-commit-signature-verification/associating-an-email-with-your-gpg-key).

Observed 2026-10-25 on [repository commit `89f99d9`](https://github.com/julie-ng/ai-native-sdlc/commit/89f99d99c4fd0348ad0ea9023b223d877a0fb2f1): Git/API `commit.author.name` is `Julie Ng`, linked API `author.login` is `julie-ng`, and the rendered GitHub author label is `julie-ng`. The proposed Goose role aliases/keys were not configured or tested. For role analysis, use raw Git names/emails or API `commit.author` fields rather than grouping solely by the linked account login.

The App rows follow from installation-token bot identity and credential-derived commit authorship. Multiple tokens or App authentication keys for the same registration do not create new bot authors. [Installation identity](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps#token-based-identification), [commit authorship](https://docs.github.com/en/graphql/reference/commits#createcommitonbranch).

**Reviews are separate from commit signatures.** A GPG key does not sign GitHub review comments. If both roles call GitHub using one App's installation tokens, their API activity uses that App identity even if their local commits have different user identities. GitHub also prohibits PR authors from approving their own PRs; if the App opens the PR, a differently scoped token for that same App is not an independent reviewer identity. The exact App approval flow remains **untested**; the current design calls for reviewer comments, not an independent required approval. [App authentication](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/about-authentication-with-a-github-app), [review API](https://docs.github.com/en/rest/pulls/reviews), [self-approval restriction](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews).

## File publication and local checkout

`createCommitOnBranch` supports additions/replacements, deletions and renames represented as deletion plus addition. Changed files are sent in full as base64, including binary contents. This is a file-change request, not an upload of a local commit or patch. The documented input has no file-mode or gitlink fields: executable-bit changes, symlinks and submodule updates cannot be assumed equivalent to native Git operations. Existing-mode preservation and other required edge cases are **not tested**. [File changes](https://docs.github.com/en/graphql/reference/git#filechanges).

**Proposed client behavior:** select intended changes against a recorded remote HEAD; send that SHA as `expectedHeadOid`; fetch the returned commit and align the checkout after confirming its tree matches the intended result. If HEAD changed, reconcile and test again. Merely retrying with a newer SHA and stale full-file contents risks overwriting concurrent edits. Native local rebasing still creates commits and needs a committer identity, even if the eventual published commits come from the App API. [Mutation contract](https://docs.github.com/en/graphql/reference/commits#createcommitonbranch), [Git identity](https://git-scm.com/docs/git-config#Documentation/git-config.txt-username).

## Rebasing and conflicts

| Situation | Native Git + local GPG | App-created commits |
|---|---|---|
| Continue work on the existing feature branch | Commit/sign/push | Append another API-created signed commit |
| Replay commits onto a newer base | Resolve conflicts, test, use `git rebase -S`, then push with a lease | Local rebase creates replacement commits; pushing with an App token does not sign them |
| GitHub “Rebase and merge” | Does not preserve original commit signatures | No documented exemption for originally App-signed commits; not a signature-preserving shortcut |

Git explicitly supports re-signing during rebase. GitHub documents its rebase-and-merge signature limitation. This differs from merging the base into a feature branch and from squash merging. [Git rebase signing](https://git-scm.com/docs/git-rebase#Documentation/git-rebase.txt---gpg-signkeyid), [GitHub rebase signatures](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification#signature-verification-for-rebase-and-merge).

Possible App approaches, **proposals requiring tests**:

- **Server merge for compatible changes:** GitHub's update-PR-branch endpoint merges the base into the head; it is not a rebase or a general conflict resolver. It requires PR-write and, for Apps, contents-write access to the head repository. The documented coder token currently has contents-write only. Signature behavior and compatibility with repository rules need testing; no permission change is selected. [Update branch API](https://docs.github.com/en/rest/pulls/pulls#update-a-pull-request-branch).
- **Rebuild from the new base:** resolve/test locally, create a temporary branch at the new base, publish the resolved file changes there through the signing API, then replace the original feature-branch ref with the completed signed history using an expected-old-SHA check. One API commit produces a squashed replacement; preserving a series requires recreating each commit. SHAs and potentially authorship change. `updateRefs` exposes expected-before OIDs and forced updates, but this complete workflow is **untested**, including PR/CI/review effects. [Ref update inputs](https://docs.github.com/en/graphql/reference/git#refupdate).

The App approach is viable to investigate, but the simple six-step publication flow does not yet establish a complete rebase/conflict workflow. It adds publication/history management beyond ordinary Git signing.

## GitLab findings

- Local GPG verification requires an uploaded public key and matching verified account/key/committer email. This part of the portability assumption is documented. [GPG requirements](https://docs.gitlab.com/user/project/repository/signed_commits/gpg/).
- GitLab also documents server signing for REST-created commits when web-based signing is enabled; custom author fields must match the authenticated user. Availability/configuration depends on the deployment. The same documentation warns that UI rebasing makes those rewritten commits unsigned. This is a possible forge-specific route, not an untested assumption that only GitHub supports server signing. No GitLab runtime was tested. [Web/API signing and rebase caveat](https://docs.gitlab.com/user/project/repository/signed_commits/web_commits/).

## Evaluation at the research checkpoint — archived

- Choose whether personal-profile contribution tooling is a requirement or repository/API analysis suffices; verify the intended analytics tool includes bots.
- Decide whether separate GitHub role actors are needed, or platform run/role records suffice.
- Test App attribution and Verified signatures for ordinary publication, stale HEAD rejection, required file types, and the chosen conflict/rebase strategy. A successful simple commit does not establish success for history rewriting.
- Native Git + GPG was the **research recommendation** if conventional rebasing and general Git operations were priorities. The App route trades key delivery for a more specialized publication workflow. The resulting decision is recorded in ADR-014.

## Decision log

| Date | Finding / disposition | Reasoning |
|---|---|---|
| 2026-10-25 | Archive evaluation after native Git + GPG was selected | ADR-014 now records the decision; the evidence and untested App proposals remain available for reference. |
| 2026-10-25 | Preserve research separately; do not select a signing mechanism | API analytics were inspected live; App publication/rebase approaches still require project-specific validation. |
