# ADR-003: Platform services vs. agent pods — trust split

- **Status:** Accepted — design, not built
- **Date:** 2026-10-21 (decisions from 2026-10-10)
- **Context:** Cloud tier (Level 2, K8s). See [ADR-002](./002-isolation-levels.md).

## Context

- Agent pods run untrusted, model-driven code. Legitimate outbound traffic: GitHub (push, forge API), platform services (artifact authorization, step status), Azure Blob Storage (artifact transfers using SAS URLs), the LLM gateway.
- Platform services (workflow service, artifact service, token broker) are authored by the platform team and need cloud resources: database, Blob Storage, Key Vault.
- Distinct Secret mounts do not require a namespace per role. Anyone authorized to create pods in a namespace can mount its Secrets, so trusted controllers choose mounts; agents must have neither Secret-read permissions nor permissions to create/modify workloads ([Kubernetes Secret access](https://kubernetes.io/docs/concepts/configuration/secret/#information-security-for-secrets)).

## Decision

| | Platform services | Agent pods |
|---|---|---|
| Examples | workflow service, artifact service, token broker, Argo | planner, coder, reviewer, open-PR step |
| Trust | trusted | untrusted |
| Cloud identity | workload identity → PostgreSQL (incl. Argo), Blob, Key Vault | **none**, except read access to the commit-signing key (below) |
| GitHub | broker holds the App key | short-lived token from the broker ([ADR-012](./012-agent-identity-commits-vs-github-tokens.md)) |
| Kubernetes | normal | no API access; projected ServiceAccount token, audience `token-broker`; committing roles also carry the workload identity token (below) |
| Platform services | — | HMAC token per run/task (below) |

- **One `agents` namespace, one ServiceAccount per role.** ServiceAccount = role, pod = run.
- Namespaces: `argo`, `platform` (workflow + artifact service), `github-broker`, `agents`. Namespaces stay free for tenancy (per team or client) later.
- Agents request artifact access and report status **through platform services**. The artifact service validates the HMAC token for the specific run and artifact, then issues a scoped Blob SAS URL. Pods upload/download artifact bytes directly to/from Azure Storage; the artifact service does not stream them.
- `automountServiceAccountToken: false` on agent pods; only the Argo controller may create pods in `agents`.

Detail: [token-broker.md](../reference/token-broker.md).

### Agent → platform services: HMAC tokens

Agents authenticate to the artifact service (and other platform services) with **HMAC tokens**, design borrowed from [Tally Split](https://tallysplit.ai.julie.io/):

- Token binds: workflow run UUID, timestamp, resource type + ID, scoped permissions.
- Request carries the token plus run UUID and task ID.
- Service verifies by looking up the run, checking expiry against run creation, checking allowed task IDs, and **recomputing** the token from stored values.
- HMAC key stays server-side; the pod holds the HMAC token and any artifact SAS URLs issued after validation.

Separate from the Kubernetes token, which is audience `token-broker` only.

### Exception: workload identity for the commit-signing key

Added 2026-11-05. Committing agent pods need the GPG private key to sign commits ([ADR-014](./014-commit-signing.md)). The key is in Key Vault and mounted by the Key Vault CSI driver using a workload identity on the committing roles' ServiceAccounts.

- **Why acceptable:** the key grants no access to any system. It signs commits, and GitHub uses the signature for verification only. Every mount option places the key in the pod anyway, so an identity that can read only that key adds no capability.
- **Why not the CSI add-on identity:** AKS attaches it to every node pool, and IMDS is blocked only in `agents`. Trusted pods in other namespaces could read the key.

Constraints, so this stays an exception:

- **One dedicated managed identity**, used for nothing else.
- **One role:** `Key Vault Secrets User`, scoped to the signing-key secret only. Any further role assignment for an agent identity needs a new decision.
- **Federated only to committing roles' ServiceAccounts.** Initial release: `coder`.
- **IMDS stays blocked** in `agents`, unchanged.

Accepted: model-driven code can use the mounted workload identity token directly, but it reaches only the key the pod already holds.

### Target design

As above.

### MVP / POC scope

Not built.

## Alternatives considered

| Option | Why not |
|---|---|
| Namespace per role solely to separate Secret mounts | Not required when trusted controllers select mounts and agents cannot read Secrets or create/modify workloads. |
| Workload identity for agent pods | Gives untrusted code cloud access it does not need. Exception: read access to the signing key only (above). |

## Consequences

**Positive**

- Agent pods have no storage account keys and no cloud identity beyond reading the signing key. Their Blob access uses artifact-scoped SAS URLs issued by the artifact service.
- Role-based scoping without per-role Secrets.

**Accepted trade-offs**

| Trade-off | Notes |
|---|---|
| Shared `agents` namespace | Anyone allowed to create pods there could pick any role's ServiceAccount. Mitigated by RBAC: only the Argo controller creates pods. |
| Every agent capability needs a platform service | Artifact authorization, status, tokens — all mediated. Artifact bytes transfer directly to/from Blob Storage. More services to build. |

## Decision log

| Date | Clarification | Reasoning |
|---|---|---|
| 2026-11-05 | Committing roles get a workload identity that can read only the signing key | Signing grants no access; the key is in the pod regardless. The CSI add-on identity would expose the key to every node pool. |
| 2026-10-24 | Secret mounts do not inherently require namespaces per role | Access depends on API permissions and control of pod creation/mounts, not on the mere presence of Secrets in a shared namespace. |

## Open

- **HMAC token delivery** into the agent pod. Argo parameters carry no tokens (see [token-broker.md](../reference/token-broker.md)), so not via a parameter. Not designed.
- **Unverified:** default ServiceAccount token lifetime on AKS may be extended for compatibility. Not relied on — automount off, dedicated projected token.
