# GitHub Actions — automatic VPS deploy

Workflow: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)  
Manual fallback: [`scripts/deploy-vps.sh`](../scripts/deploy-vps.sh)

## How it works

Deploy runs on a **self-hosted runner** installed on the VPS (`runs-on: [self-hosted, clearform-vps]`). It executes the same commands as `deploy-vps.sh` in `/var/www/clearform-backend` — no SSH from GitHub’s cloud runners (they cannot reach your VPS on port 22).

## One-time runner setup

1. Open **GitHub → CoderRahul01/Clearform-backend-main → Settings → Actions → Runners**.
2. **Automated (recommended):** from your Mac with `gh auth login` and SSH to the VPS:

```bash
USE_GH_TOKEN=1 VPS_HOST=147.93.96.250 VPS_USER=root VPS_SSH_KEY_PATH=~/.ssh/github_actions_vps \
  ./scripts/setup-github-runner-on-vps.sh
```

(`gh` fetches a fresh registration token; no manual copy/paste.)

**Manual:** Settings → Actions → Runners → **New self-hosted runner** → copy the full `--token` from the `./config.sh` command (valid ~1 hour).
3. From your Mac (in `Clearform-backend-main`):

```bash
GITHUB_RUNNER_TOKEN=<paste-token-here> \
VPS_HOST=147.93.96.250 VPS_USER=root VPS_SSH_KEY_PATH=~/.ssh/github_actions_vps \
./scripts/setup-github-runner-on-vps.sh
```

4. In GitHub, confirm the runner **clearform-vps** is **Idle**.

Every **push to `main`** then deploys automatically.

## Migrations

- **Actions:** **Deploy Backend to VPS → Run workflow** → check **run_migrate**.
- **Laptop:** `RUN_MIGRATE=1 VPS_HOST=... VPS_USER=root VPS_SSH_KEY_PATH=~/.ssh/github_actions_vps ./scripts/deploy-vps.sh`

Push deploys do **not** run migrations unless you use workflow_dispatch with **run_migrate**.

## Manual deploy (no Actions)

```bash
VPS_HOST=147.93.96.250 VPS_USER=root VPS_SSH_KEY_PATH=~/.ssh/github_actions_vps ./scripts/deploy-vps.sh
```

## Legacy GitHub secrets

`VPS_HOST`, `VPS_USERNAME`, and `VPS_SSH_KEY` are **not used** by the current workflow. You can leave them in the repo or remove them; they only matter for manual SSH / older SSH-based workflows.
