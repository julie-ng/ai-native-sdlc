# ADR-003: Platform services vs. agent pods — trust split

- **Status:** Accepted — initial release built (2026-11-11); token broker not built
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
| Cloud identity | workload identity → PostgreSQL (incl. Argo), Blob, Key Vault | **none**, except read access to the long-lived secrets the pod needs (below) |
| GitHub | broker holds the App key | short-lived token from the broker ([ADR-012](./012-agent-identity-commits-vs-github-tokens.md)) |
| Kubernetes | normal | no API access; projected ServiceAccount token, audience `token-broker`; planner and coder also carry the workload identity token (below) |
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

<a id="exception-workload-identity-for-the-commit-signing-key"></a>

### Workload identity for long-lived secrets

Added 2026-11-05 for the commit-signing key, generalized 2026-11-07. Granular, secret-scoped permissions in infrastructure code replace blanket denial.

Agent pods read the long-lived secrets they need directly from Key Vault. The Key Vault CSI driver mounts them using a workload identity per role.

- **Only secrets the pod needs anyway**, for example the AI gateway key, the GitHub PAT (temporary, until the broker) and the commit-signing key.
- **One managed identity per role**, federated only to that role's ServiceAccount.
- **One `Key Vault Secrets User` grant per secret**, at secret scope. No vault-scope grants, no other roles.
- **IMDS stays blocked** in `agents`, unchanged.

| Role | Secrets (initial release) |
|---|---|
| planner | AI gateway key, GitHub PAT |
| coder | AI gateway key, GitHub PAT, commit-signing key |

- **Why acceptable:** every delivery option places the secret in the pod. An identity that can read only those secrets adds no capability; a leaked workload identity token reaches only what the pod already holds.
- **Why not copies in Kubernetes Secrets:** manual or per-run copies in etcd, rotated by hand. The CSI mount reads the current value.
- **Why not the CSI add-on identity:** AKS attaches it to every node pool, and IMDS is blocked only in `agents`. Trusted pods in other namespaces could read the secrets.
- **Per-run credentials are different.** HMAC tokens exist only once a run is created, so a trusted step delivers them, not workload identity ([ADR-016](./016-hmac-caller-authentication.md)).

Accepted: the planner holds the PAT because `gh` requires authentication even for public repositories. The PAT is not role-scoped, so the planner could push; branch rulesets still require a PR and signed commits on `main`. The token broker replaces the PAT with per-role tokens.

### Target design

As above.

### MVP / POC scope

Built for the initial release (2026-11-11). See the [credential flow](../reference/credential-flow.md).

- `agents` namespace, one ServiceAccount per role; planner and coder run as separate pods.
- Agent → platform services: HMAC step tokens, delivered by the trusted `foreman` step ([ADR-016](./016-hmac-caller-authentication.md)).
- Long-lived secrets by workload identity and CSI, one secret-scoped grant each: planner reads the AI gateway key and PAT; coder also the GPG key.
- **Not built:** the token broker. A temporary PAT, shared by planner and coder, stands in for per-pod GitHub tokens.

## Alternatives considered

| Option | Why not |
|---|---|
| Namespace per role solely to separate Secret mounts | Not required when trusted controllers select mounts and agents cannot read Secrets or create/modify workloads. |
| Workload identity for agent pods | Gives untrusted code cloud access it does not need. Exception: read access to the long-lived secrets the pod needs (above). |

## Consequences

**Positive**

- Agent pods have no storage account keys and no cloud identity beyond reading the long-lived secrets the pod needs. Their Blob access uses artifact-scoped SAS URLs issued by the artifact service.
- Role-based scoping without per-role Secrets.

**Accepted trade-offs**

| Trade-off | Notes |
|---|---|
| Shared `agents` namespace | Anyone allowed to create pods there could pick any role's ServiceAccount. Mitigated by RBAC: only the Argo controller creates pods. |
| Every agent capability needs a platform service | Artifact authorization, status, tokens — all mediated. Artifact bytes transfer directly to/from Blob Storage. More services to build. |

## Decision log

| Date | Clarification | Reasoning |
|---|---|---|
| 2026-11-07 | Generalize the exception: planner and coder read the long-lived secrets they need (AI gateway key, PAT, signing key) through workload identity, one secret-scoped grant each | Same reasoning as the signing key: the secret is in the pod regardless. Simpler than copying values into Kubernetes Secrets. Granular grants in infrastructure code instead of blanket denial. |
| 2026-11-05 | Committing roles get a workload identity that can read only the signing key | Signing grants no access; the key is in the pod regardless. The CSI add-on identity would expose the key to every node pool. |
| 2026-10-24 | Secret mounts do not inherently require namespaces per role | Access depends on API permissions and control of pod creation/mounts, not on the mere presence of Secrets in a shared namespace. |

## Open

- **HMAC token delivery** into the agent pod: a trusted `foreman` step creates the run and writes one Kubernetes Secret per step, owned by the Workflow ([infrastructure#19](https://github.com/julie-ng/ai-native-sdlc-infrastructure/issues/19)). Argo parameters carry no tokens. Designed, not built.
- **Unverified:** default ServiceAccount token lifetime on AKS may be extended for compatibility. Not relied on — automount off, dedicated projected token.
