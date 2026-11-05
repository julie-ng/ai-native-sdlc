# ADR-016: Caller authentication for platform services — HMAC tokens for the first release

- **Status:** Accepted — design, not built
- **Date:** 2026-11-05
- **Context:** How agent steps authenticate to the platform services (artifact service, workflow service). Confirms the mechanism in [ADR-003](./003-platform-services-vs-agent-pods.md) as a pragmatic first-release choice and defers the Kubernetes ServiceAccount alternative.

## Context

- Every platform-service route needs a trusted caller context: run, step, task type and the artifacts the step may read or produce.
- [ADR-003](./003-platform-services-vs-agent-pods.md) documents HMAC tokens, but the workflow-service plan and the platform-services decision log still listed HMAC versus Kubernetes ServiceAccount tokens as open.
- The Kubernetes ServiceAccount approach is already used for the GitHub token broker ([token broker](../reference/token-broker.md)): a projected token, validated with TokenReview, identifies the role and the pod, and pod metadata stamped by Argo supplies the rest.

## Decision

**Authenticate callers to platform services with HMAC tokens in the first release.** The ServiceAccount approach stays a candidate for later and is not rejected.

### Why HMAC

- **Cluster-free callers.** A token verified with a server-side key works for callers outside Kubernetes, including local development, without TokenReview or a cluster API.
- **Reuse.** The design and much of the implementation come from Tally Split, as ADR-003 notes.

This is a pragmatic choice for the first release, not a finding that HMAC is the better long-term mechanism.

### Token and verification

As in [ADR-003](./003-platform-services-vs-agent-pods.md):

- The token binds the workflow run UUID, a timestamp, the resource type and ID, and the scoped permissions.
- The request carries the token plus the run UUID and task ID.
- The service looks up the run, checks expiry against run creation, checks the allowed task IDs and recomputes the token from stored values.
- The HMAC key stays server-side, in Key Vault ([infrastructure decision log](../../infrastructure/docs/decisions.md)). It never enters an agent credential.

### MVP / POC scope

Nothing is built. Caller authentication, token issuance and credential delivery all remain implementation work.

## Alternatives considered

| Alternative | Status |
|---|---|
| Kubernetes ServiceAccount tokens (projected token, TokenReview, run and step from pod metadata) | Deferred, not rejected. Needs more exploration; callers must run in the cluster. |
| Service mesh or mTLS | Not evaluated. |

## Consequences

### Positive

- One mechanism for in-cluster and cluster-free callers.
- No dependency on the Kubernetes API for request authentication.
- Existing implementation to adapt.

### Accepted trade-offs

- A shared signing key to store and rotate.
- A credential-delivery problem the ServiceAccount approach would avoid: Argo parameters cannot carry tokens, so the pod needs another route to its token.

## Open

- **Credential delivery into the pod.** Not designed. A pull exchange, where the pod presents its projected ServiceAccount token and the workflow service issues the scoped HMAC, was discussed but not decided. It would need run and step labels stamped by Argo, a platform-service audience on the projected token, and TokenReview plus pod-read permissions for the issuer.
- **Where task type, inputs and outputs come from.** Embedded in the token, or looked up by the service from its own records. The workflow-service plan holds this open.
- **Response codes and security-event logging** (401 versus 403).
- **Revisit ServiceAccount authentication** once the broker is built and the exchange above has been explored.

## Verification

None. Not built.
