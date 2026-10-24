# ADR-003: Platform services vs. agent pods — trust split

- **Status:** Accepted — design, not built
- **Date:** 2026-10-21 (decisions from 2026-10-10)
- **Context:** Cloud tier (Level 2, K8s). See [ADR-002](./002-isolation-levels.md).

## Context

- Agent pods run untrusted, model-driven code. Legitimate outbound traffic: GitHub (push, forge API), platform services (artifacts, step status), the LLM gateway. No cloud APIs.
- Platform services (workflow service, artifact service, token broker) are authored by the platform team and need cloud resources: database, Blob Storage, Key Vault.
- Distinct Secret mounts do not require a namespace per role. Anyone authorized to create pods in a namespace can mount its Secrets, so trusted controllers choose mounts; agents must have neither Secret-read permissions nor permissions to create/modify workloads ([Kubernetes Secret access](https://kubernetes.io/docs/concepts/configuration/secret/#information-security-for-secrets)).

## Decision

| | Platform services | Agent pods |
|---|---|---|
| Examples | workflow service, artifact service, token broker, Argo | planner, coder, reviewer, open-PR step |
| Trust | trusted | untrusted |
| Cloud identity | workload identity → PostgreSQL (incl. Argo), Blob, Key Vault | **none** |
| GitHub | broker holds the App key | short-lived token from the broker ([ADR-012](./012-agent-identity-commits-vs-github-tokens.md)) |
| Kubernetes | normal | no API access; projected ServiceAccount token, audience `token-broker` only |
| Platform services | — | HMAC token per run/task (below) |

- **One `agents` namespace, one ServiceAccount per role.** ServiceAccount = role, pod = run.
- Namespaces: `argo`, `platform` (workflow + artifact service), `github-broker`, `agents`. Namespaces stay free for tenancy (per team or client) later.
- Agents reach artifacts and report status **through platform services**, never cloud APIs directly.
- `automountServiceAccountToken: false` on agent pods; only the Argo controller may create pods in `agents`.

Detail: [token-broker.md](../reference/token-broker.md).

### Agent → platform services: HMAC tokens

Agents authenticate to the artifact service (and other platform services) with **HMAC tokens**, design borrowed from [Tally Split](https://tallysplit.ai.julie.io/):

- Token binds: workflow run UUID, timestamp, resource type + ID, scoped permissions.
- Request carries the token plus run UUID and task ID.
- Service verifies by looking up the run, checking expiry against run creation, checking allowed task IDs, and **recomputing** the token from stored values.
- HMAC key stays server-side; the pod only ever holds a token.

Separate from the Kubernetes token, which is audience `token-broker` only.

### Target design

As above.

### MVP / POC scope

Not built.

## Alternatives considered

| Option | Why not |
|---|---|
| Namespace per role solely to separate Secret mounts | Not required when trusted controllers select mounts and agents cannot read Secrets or create/modify workloads. |
| Workload identity for agent pods | Gives untrusted code cloud access it does not need. |

## Consequences

**Positive**

- A compromised agent pod holds no cloud credential at all.
- Role-based scoping without per-role Secrets.

**Accepted trade-offs**

| Trade-off | Notes |
|---|---|
| Shared `agents` namespace | Anyone allowed to create pods there could pick any role's ServiceAccount. Mitigated by RBAC: only the Argo controller creates pods. |
| Every agent capability needs a platform service | Artifacts, status, tokens — all mediated. More services to build. |

## Decision log

| Date | Clarification | Reasoning |
|---|---|---|
| 2026-10-24 | Secret mounts do not inherently require namespaces per role | Access depends on API permissions and control of pod creation/mounts, not on the mere presence of Secrets in a shared namespace. |

## Open

- **HMAC token delivery** into the agent pod. Argo parameters carry no tokens (see [token-broker.md](../reference/token-broker.md)), so not via a parameter. Not designed.
- **Unverified:** default ServiceAccount token lifetime on AKS may be extended for compatibility. Not relied on — automount off, dedicated projected token.
