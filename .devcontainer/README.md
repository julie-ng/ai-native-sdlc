# Dev container

### Why use a Dev Container?

- **Separate agent identity.** Use the agent's own Git and GitHub credentials inside the container to attribute commits and pushes separately from yours.
- **Explicit credential mounts.** Mount GPG keys for signing commits and an environment file for GitHub authentication and Git author configuration. The [sample](./devcontainer.sample.json) demonstrates a read-only mount: readable by the agent, but not writable through the mount. See [AGENTS.md](../AGENTS.md#git--github-configuration) for configuration.
- **Keep personal configuration local.** Your `devcontainer.json` stays untracked, including credential mount paths.

### Features

- **Custom image:** `julieio/agent-devcontainer:v0.4.0` supplies the base environment. This version still uses the `node` user.
- **Python 3.12:** adds Python and its tooling through a dev-container feature, alongside the custom image.
- **Docker-in-Docker:** provides a Docker daemon inside the container to build and run the repo's experimental images. This feature uses privileged container operation.
- **Dotfiles:** [Julie's shell configuration](https://github.com/julie-ng/dotfiles) makes the environment familiar across sessions. Included as an example; replace or remove it for your own setup. The configured install command is `sync.sh --force`.
