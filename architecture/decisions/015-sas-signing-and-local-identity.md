# ADR-015: SAS signing — user delegation keys, with a service principal for local development

- **Status:** Accepted
- **Date:** 2026-11-04
- **Context:** Artifact service signing Blob SAS URLs, in the cluster and in local development. Refines the signing mechanism in [ADR-005](./005-state-and-artifacts.md) and [ADR-003](./003-platform-services-vs-agent-pods.md).

## Context

- The artifact service issues per-blob SAS URLs so agent pods transfer artifact bytes directly to and from Azure Storage ([ADR-005](./005-state-and-artifacts.md)). Pods hold no cloud identity[^signing-key] or storage account keys ([ADR-003](./003-platform-services-vs-agent-pods.md)).
- The service authenticates to Azure with Microsoft Entra ID. In the cluster that is workload identity, which has no account key.
- Local development needs the same signing path without a cluster.

## Decision

**Sign every artifact SAS with a user delegation key. Never use storage account keys.**

### Target design

- A user delegation key is the only way to sign a SAS when the signer authenticates with Entra ID and holds no account key.
- "User" means an Entra security principal, not a human. A managed identity or service principal can request the key; only the `generateUserDelegationKey` action is needed.
- In the cluster, the service uses its workload identity.

### MVP / POC scope: local development

- The service authenticates as a **dedicated service principal**, configured through `AZURE_TENANT_ID`, `AZURE_CLIENT_ID` and `AZURE_CLIENT_SECRET`. `DefaultAzureCredential` reads these, so local development runs the same signing code as the cluster.
- Role assignments:
  - **Storage Blob Data Contributor** on one container (`local-dev`).
  - **Storage Blob Delegator** on the storage account, which the key request requires.
- A SAS allows only what both its permissions and the signer's roles allow. SAS URLs signed locally therefore work only in `local-dev`.
- Provisioned in the infrastructure repository.

## Alternatives considered

| Alternative | Why rejected |
|---|---|
| Account-key SAS | Simpler locally, but the key is a never-expiring, account-wide secret. It adds a second signing path that never runs in the cluster. |
| Container SAS as the server credential | The server cannot sign narrower per-blob SAS URLs from a SAS. |

## Consequences

### Positive

- One signing path in every environment.
- No account-wide secret. Shared keys stay off on storage.
- Local blast radius is one container.

### Accepted trade-offs

- One extra Azure call per issued SAS, since delegation keys are not cached.
- An account-scoped Delegator role.
- A client secret in the local `.env`, limited to one container and expiring.

## Open

- Cache the delegation key if the per-SAS call matters.

## Verification

2026-11-04, throwaway script against `local-dev`:

- Upload, download and overwrite succeeded.
- Azure returned 403 `AuthorizationPermissionMismatch` for:
  - writing with a read SAS,
  - reading with a write SAS,
  - reading another container.

[^signing-key]: One exception: the coder can read the commit-signing key. See [ADR-003](./003-platform-services-vs-agent-pods.md#exception-workload-identity-for-the-commit-signing-key).
