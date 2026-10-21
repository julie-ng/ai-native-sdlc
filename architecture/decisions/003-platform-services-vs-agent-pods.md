# ADR-003: Platform services vs. agent pods — trust split

- **Status:** Accepted — design, not built
- **Date:** 2026-10-21 (decisions from 2026-10-10)
- **Context:** Cloud tier (Level 2, K8s). See [ADR-002](./002-isolation-levels.md).

## Context

- Agent pods run untrusted, model-driven code. Their only legitimate outbound write is GitHub.
- Platform services (workflow service, artifact service, token broker) are authored by the platform team and need cloud resources: database, Blob Storage, Key Vault.
- Per-role Kubernetes Secrets would force one namespace per role — any pod in a namespace can mount any Secret in it.

## Decision

| | Platform services | Agent pods |
|---|---|---|
| Examples | workflow service, artifact service, token broker | planner, coder, reviewer, open-PR step |
| Trust | trusted | untrusted |
| Cloud identity | workload identity → PostgreSQL, Blob, Key Vault | **none** |
| GitHub | broker holds the App key | short-lived token from the broker ([ADR-012](./012-cloud-agent-identity.md)) |
| Kubernetes | normal | no API access; projected ServiceAccount token, audience `token-broker` only |

- **One `agents` namespace, one ServiceAccount per role.** ServiceAccount = role, pod = run.
- Namespaces: `argo`, `platform` (workflow + artifact service), `github-broker`, `agents`. Namespaces stay free for tenancy (per team or client) later.
- Agents reach artifacts and report status **through platform services**, never cloud APIs directly.
- `automountServiceAccountToken: false` on agent pods; only the Argo controller may create pods in `agents`.

Detail: [token-broker.md](../token-broker.md).

### Target design

As above.

### MVP / POC scope

Not built.

## Alternatives considered

| Option | Why not |
|---|---|
| Namespace per role with per-role Secrets | Secret-per-role forces namespace-per-role. Not needed once no per-role Secrets exist. |
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

## Open

- **Unverified:** default ServiceAccount token lifetime on AKS may be extended for compatibility. Not relied on — automount off, dedicated projected token.
