# Token broker — just-in-time GitHub credentials for agent pods

> [!NOTE]
> Design draft, 2026-10-10. Not built. Captured from a design session so it survives context loss. See [identity](./identity.md) and [02 · Architecture](../02-architecture.md).

A small platform service that issues each agent pod a short-lived GitHub installation token, downscoped to the pod's role and one repository. Agents never hold the GitHub App private key or a cloud identity. For artifact transfers they receive scoped Blob SAS URLs from the artifact service ([ADR-005](../decisions/005-state-and-artifacts.md)).

## Why

- Agent pods run untrusted, model-driven code. They write to GitHub and transfer artifacts directly to/from Azure Storage using SAS URLs. In-cluster they call platform services for artifact authorization and step status. See [ADR-003](../decisions/003-platform-services-vs-agent-pods.md).
- Per-role Kubernetes Secrets would force one namespace per role, because any pod in a namespace can mount any Secret in it.
- Pulling per-run tokens from a cloud vault (Key Vault, Secrets Manager, Secret Manager) fails two ways:
  - The pod needs a cloud identity to read the vault → per-pod workload identity comes back, or node identity loses per-role scoping, or a "secret zero" is needed.
  - Cloud vaults are built for long-lived secrets. Writing and deleting one secret per run hits rate limits, soft-delete/recovery windows, per-secret billing and audit noise. **Unverified:** exact limits and pricing per provider.
- Passing the token as an Argo parameter puts it in the Workflow object. Env vars surface in `kubectl describe` and logs.

## Identity split

| | Platform services | Agent pods |
|---|---|---|
| Examples | workflow service, artifact service, **token broker** | planner, coder, reviewer |
| Trust | trusted, authored by us | untrusted, model-driven |
| Cloud identity | **workload identity** → database, Blob Storage, Key Vault | **none** |
| GitHub credential | broker holds App private key (from Key Vault) | short-lived installation token from broker |
| Kubernetes credential | normal | projected ServiceAccount token, audience `token-broker` only |

## Kubernetes tokens — how they work today

- **Bound, projected tokens** (default since roughly K8s 1.22–1.24). No auto-created, never-expiring token Secrets anymore.
- **One token per pod**, not per ServiceAccount. Minted by the kubelet via the TokenRequest API at pod start, mounted as a file.
- **Bound to the pod:** claims include pod name and UID. Invalid once the pod is deleted, even before expiry.
- **Time-limited, auto-rotated:** `expirationSeconds` on the projected volume (minimum 600s); kubelet refreshes the file before expiry.
- **Audience-bound:** audience `token-broker` makes the token useless against the Kubernetes API or anything else checking audience.

> [!IMPORTANT]
> The **default** mounted token may be issued with an extended lifetime on managed clusters, for compatibility with older clients. **Unverified** for the target AKS version. Do not rely on it:
> - `automountServiceAccountToken: false` on agent pods
> - Dedicated projected token volume: `audience: token-broker`, short `expirationSeconds`

## Role vs. run

**ServiceAccount = role. Pod = run.**

- One ServiceAccount per role (`planner`, `coder`, `reviewer`), all in one `agents` namespace. Argo sets `serviceAccountName` per template.
- Concurrent pods of the same role share the **identity** (ServiceAccount), never the **token** (one per pod).
- Role comes from the ServiceAccount. Repository comes from the pod's metadata.

## Flow

1. Workflow service submits the workflow with run metadata (repository, issue).
2. Argo creates each step's pod, stamping labels/annotations from the workflow (workflow name, repository).
3. Agent pod starts, reads its projected token file, calls the broker URL: "give me my token". **The request names no repository.**
4. Broker validates the token via Kubernetes **TokenReview** → ServiceAccount (role) + bound pod name/UID.
5. Broker reads **that pod's** metadata from the Kubernetes API → repository.
6. Broker signs a JWT with the GitHub App private key, calls `POST /app/installations/<id>/access_tokens` with `repositories` and `permissions` downscoped to the role and repository.
7. Broker returns the token (1-hour expiry). Runs longer than an hour simply ask again.

## Security properties

- **Denied by construction:** a reviewer for repo B cannot get a token for repo A, because the request has no repository field. Nothing to reject, no check to get wrong.
- **Metadata set only by trusted code:** workflow service → Argo. Agent pods have no Kubernetes API access, so they cannot relabel themselves.
- **Broker trusts the API, never the request body.** The body is agent-controlled, ultimately model-controlled.
- **Private key never enters an agent pod.** Only the broker reads it, via its own workload identity.
- **Token lifetime ≤ 1 hour, pod-bound K8s token:** a leaked broker credential dies with the pod.

## Role → permission mapping (draft)

| Role | GitHub App permissions in minted token |
|---|---|
| planner | issues: write, contents: read |
| coder | contents: write |
| reviewer | contents: read, pull requests: write (posts review comments on the PR — confirmed 2026-10-11) |
| open-PR step | pull requests: write |

> [!NOTE]
> The App itself needs the **union** of these — including **Issues**, which the planner needs to read issues on private repos and to comment.

## Implementation notes

- Own `github-broker` namespace, separate from `platform` (workflow + artifact service) — see [ADR-003](../decisions/003-platform-services-vs-agent-pods.md). Workload identity → Key Vault (App private key) only.
- Small surface: TokenReview, one pod lookup, one JWT sign, one GitHub API call. Estimate: a few hundred lines.
- Broker's own Kubernetes RBAC: `tokenreviews: create`, `pods: get` in the `agents` namespace. Nothing else.
- Label values can't contain `/` → put `owner/repo` in an **annotation**, or use the numeric repository ID as a label.
- Shared namespace caveat: anyone allowed to create pods in `agents` could pick any role's ServiceAccount. Restrict pod creation there to the Argo controller via RBAC.
- **JWT:** RS256, `iss` = App ID, `exp` ≤ 10 min. The minted token (`ghs_…`) is used as an HTTPS credential — `https://x-access-token:<token>@github.com/…` — and as `GH_TOKEN` for `gh`.
- GitHub issues the App key in **PKCS#1**; some JWT libraries (Node's `jsonwebtoken`) want PKCS#8. Convert with `openssl pkcs8 -topk8 -nocrypt`. Verify a key matches GitHub's record by comparing `openssl rsa -pubout | sha256 | base64` against the fingerprint on the App's settings page.
- Use Octokit (`@octokit/auth-app`) or PyGithub rather than hand-rolling JWT signing, unless debugging inside a container that lacks them.
- Possible off-the-shelf alternative: HashiCorp Vault / OpenBao Kubernetes auth + a community GitHub App token plugin. **Unverified** — check plugin maturity before considering.

## Open questions

- Broker availability: if it's down, no agent can start. Replicas + readiness are enough? Cache nothing — tokens are per pod.
- Exact projected-token `expirationSeconds` vs. longest expected step duration.

## Decision log

| Date | Decision | Notes |
|---|---|---|
| 2026-10-21 | Cloud: agent user commits and signs, broker's App token pushes | [ADR-012](../decisions/012-cloud-agent-identity.md) |
| 2026-10-21 | Broker in its own `github-broker` namespace | [ADR-003](../decisions/003-platform-services-vs-agent-pods.md) |
| 2026-10-11 | Reviewer posts review comments on the pull request | Reviewer token gets pull requests: write. Resolves the open question. |
| 2026-10-10 | Agent pods get no cloud identity | Workload identity reserved for platform services (DB, Blob, Key Vault). Artifact access clarified 2026-10-23: pods use service-issued SAS URLs. [ADR-003](../decisions/003-platform-services-vs-agent-pods.md), [ADR-005](../decisions/005-state-and-artifacts.md) |
| 2026-10-10 | One `agents` namespace, one ServiceAccount per role | Replaces namespace-per-role. Possible because no per-role K8s Secrets exist. Namespaces freed for tenancy (per team/client). [ADR-003](../decisions/003-platform-services-vs-agent-pods.md) |
| 2026-10-10 | Pull model via token broker, not cloud vault | Vault needs per-pod cloud identity and isn't built for per-run secret churn. Broker auth uses the cloud-agnostic K8s ServiceAccount token. |
| 2026-10-10 | Repository derived from pod metadata, never from the request | Denied by construction. |
| 2026-10-10 | Argo parameters carry references (broker URL, role), never tokens | Workflow objects are readable; tokens must not land there. |
