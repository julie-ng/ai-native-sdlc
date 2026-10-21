# ADR-010: Agent images — official goose base, skills baked, one image per role

- **Status:** Accepted — base image preference pending measurement
- **Date:** 2026-10-21 (image plan 2026-10-19)
- **Context:** Cloud tier, agent pods.

## Context

- Each agent step is its own container ([ADR-004](./004-orchestration-argo-workflows.md)); roles differ mainly in skills.
- Config is baked, secrets arrive at runtime — established in the spikes.

## Decision

- **Base image:** prefer the **official goose image** (`ghcr.io/aaif-goose/goose`), tag-pinned, **if it makes the image smaller**.
- Base adds: Python environments, `jq`, `gh`, `glab`, recipes.
- **Role images inherit from the base**, differing only in which skills are copied in, plus labels.
- **Skills baked into images**, not pulled at runtime — less startup traffic, no runtime version management.
- `CMD` is `bash`; the base image's `goose` `ENTRYPOINT` is reset.
- Install as root, drop to the unprivileged user last.

### Target design

As above, published per role.

### MVP / POC scope

- One image, [goose-k8s-prep](../../spikes/goose-k8s-prep/), on `ghcr.io/aaif-goose/goose:v1.48.0`.

## What the size claim rests on

Measured in [goose-k8s-prep](../../spikes/goose-k8s-prep/README.md#base-image):

| | Size |
|---|---|
| Official goose base (bare) | 496MB |
| Hand-built image on `node:22-slim` | 946MB |
| Current image on official base, toolchain added | 1.06GB |

- goose arrives stripped upstream, ~60MB smaller than the hand-installed binary.
- The final image grew because it carries Python and TypeScript that the old one lacked.
- **Not measured:** the same toolchain on `devcontainers/base:ubuntu`. The preference holds only if that comparison comes out in goose's favour.

## Alternatives considered

| Option | Why not (yet) |
|---|---|
| `devcontainers/base:ubuntu` + install goose, `agent` user | Earlier plan. Unmeasured against the official base. |
| Skills fetched at startup under the pod's identity | Leaning option in [parked skills doc](../parked/skills-distribution-and-governance.md); superseded by baking. |

## Consequences

**Accepted trade-offs**

| Trade-off | Notes |
|---|---|
| Large images | Coding agents are hefty; layers cache per node after first pull. |
| Skill change = image rebuild | The price of no runtime version management. |
| Official base user is `goose`, uid 1000 | Not renamable via `ARG`; uid matches the pod `securityContext`. |
