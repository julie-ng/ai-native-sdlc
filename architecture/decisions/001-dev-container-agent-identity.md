# ADR-001: Dev container agent identity — own account, classic PAT, GPG signing

- **Status:** Accepted
- **Date:** 2026-10-20
- **Context:** **Dev containers** on my machine. I prompt the agent, then it works autonomously; no human needs to be present during the run. Unsupervised cloud agents (K8s pods) are a separate decision, not covered here.
- **Supersedes:** the local-tier "ED25519 key + deploy key + SSH signing" plan in [identity.md](../identity.md#local-tier--bot-account--deploy-key)

## Context

- The agent needs its own identity: commits and PRs attributed to the agent, not me.
- Its work does not end at `git push`. Reading issues and opening PRs goes through `gh`, i.e. the GitHub REST API over HTTPS, which needs a token.
- An SSH key only covers git transport. Once a token is unavoidable, an SSH key on top means two credentials for one identity.
- Signing answers a different question (attribution: *who wrote this commit*) than authentication (*can it push*). Keep them on separate mechanisms.

## Decision

| Concern | Mechanism |
|---|---|
| Identity | Dedicated GitHub account `julieio-agent`, **collaborator** on the repos it works in |
| Authentication | **Classic PAT**, `GH_TOKEN` + `gh auth setup-git`, HTTPS for both git and `gh` |
| Least privilege | **On the repository** — collaborator access and role — not on the token |
| Signing | **GPG** Ed25519 key, no passphrase, 1-year expiry (expires 2027-10-20) |
| Delivery | Generated outside the container; mounted read-only at runtime, imported into the container's GnuPG home. Never baked into an image or committed. |

Setup steps: [AGENTS.md → Git & GitHub Configuration](../../AGENTS.md#git--github-configuration).

Key generation, run outside the container in a dedicated directory:

```sh
gpg --homedir "." \
  --batch --pinentry-mode loopback --passphrase '' \
  --quick-generate-key 'julieio-agent <agent-email>' \
  ed25519 sign 1y
```

## Alternatives considered

| Option | Why not |
|---|---|
| SSH key for transport + signing | Does not cover `gh` / the API. |
| SSH key + PAT | Two credentials for one identity. |
| SSH signing instead of GPG | Semantically wrong signal. SSH reads as access/authentication; this key only verifies identity on commits and authenticates nothing. GPG is the plain, unambiguous fit. |
| Fine-grained PAT / per-repo tokens | Token churn for every repo in an interactive dev container. Least privilege already lives on the repo via collaborator access. |

## Consequences

**Positive**

- One credential for transport and API; `gh` and `git` share it.
- Attribution separate from authentication — the signing key grants no access to anything.
- Commits show **Verified** under the agent's account.
- Adding a repo = add the agent as a collaborator. No new token.

**Accepted trade-offs**

| Trade-off | Notes |
|---|---|
| Classic PAT is account-wide, not repo-scoped | Reach = every repo the agent account is a collaborator on, at its granted role. The boundary is GitHub's repo permissions, enforced server-side — keep the account's collaborator list minimal. Account-level scopes (e.g. `gist`, `user`) act on the agent's own account. |
| Signing key has no passphrase | Required for unattended signing. Read-only mount stops writes, not reads — anything in the container can copy it. Blast radius: forged "Verified" commits as the agent, no repo access. |
| Long-lived credentials in the container | PAT and signing key both persist across sessions and are available to the agent during autonomous runs. Accepted for a dev container on my machine. |
| Key expiry | Rotate before 2027-10-20. Revocation certificate kept outside the container. |

> [!NOTE]
> **Unverified:** the PAT's current scope set. [identity.md](../identity.md#what-the-pat-actually-scopes) recorded `repo`, `gist`, `project`, `user` on 2026-09-11 for the then-`julieio-goose` account; not re-checked since the rename.

## Verification

- Commits `9f9a655` and `3c8d9fc`: signed by key `33BFA959316A465E`; GitHub API returns `verified: true`, `reason: valid`, author `julieio-agent` (checked 2026-10-20).
