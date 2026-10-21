# Stale, i.e. learnings

Older ideas are still saved here to avoid repeating the same mistakes or Denkfehler.

## Major Learnings

- [**Skills distribution and governance**](./skills-distribution-and-governance.stale.md) - full options analysis (bake / mount / pull from GitHub / pull from Blob) and goose's missing skills governance. Decided in [ADR-013](../architecture/decisions/013-skills-distribution.md): bake for the POC, target left to the platform.

- [**Session Management**](./session-management.stale.md) - both herdr and agent-manager were for managing sessions on the host machine, i.e. my computer. After digging deeper into agent-manager and realizing its mechanisms rely on scraping `stdout`, I realized this doesn't move me towards my goal. It was designed more for passive baby-sitting and not full autonomy through to Pull Requests.


- [**Docker Sandbox**](./docker-bandbox.stale.md) - because I needed a different orchestration method, I didn't need the extra protection Docker Sandbox provides. A simple container is enough because ultimately these agents will run in a remote k8s cluster and not my local machine, which has personal data.
