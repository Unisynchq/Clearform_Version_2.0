#!/usr/bin/env bash
# deploy-vps.sh — Manual backend deploy when GitHub Actions cannot reach VPS:22
#
# Mirrors .github/workflows/deploy.yml remote steps (git pull, bun, prisma generate, optional migrate, build, pm2).
# GitHub secrets: docs/deploy-github-actions.md
# Run from your laptop on the same network/path that already works: ssh user@host
#
# Usage:
#   export VPS_HOST=your.vps.ip.or.hostname
#   export VPS_USER=deploy                    # same as GitHub secret VPS_USERNAME
#   export VPS_SSH_KEY_PATH=~/.ssh/github_actions_vps # matches Hostinger "github-actions" key
#   ./scripts/deploy-vps.sh
#
# Optional:
#   RUN_MIGRATE=1 ./scripts/deploy-vps.sh   # runs npx prisma migrate deploy on VPS (schema changes)
#   VPS_PORT=22 ./scripts/deploy-vps.sh     # non-default SSH port
#
# After deploy:
#   curl -sS https://api.clearform.in/api/v1/health
#
# Troubleshooting: docs/deploy-github-actions.md (secrets/key format), docs/memory.md (SSH timeouts)

set -euo pipefail

VPS_HOST="${VPS_HOST:-}"
VPS_USER="${VPS_USER:-${VPS_USERNAME:-}}"
VPS_SSH_KEY_PATH="${VPS_SSH_KEY_PATH:-}"
VPS_PORT="${VPS_PORT:-22}"
RUN_MIGRATE="${RUN_MIGRATE:-0}"

if [[ -z "$VPS_HOST" || -z "$VPS_USER" || -z "$VPS_SSH_KEY_PATH" ]]; then
  echo "error: set VPS_HOST, VPS_USER (or VPS_USERNAME), and VPS_SSH_KEY_PATH" >&2
  echo "example: VPS_HOST=<IP from Hostinger → Settings → IP address>" >&2
  echo "         VPS_USER=root VPS_SSH_KEY_PATH=~/.ssh/github_actions_vps $0" >&2
  exit 1
fi

VPS_SSH_KEY_PATH="${VPS_SSH_KEY_PATH/#\~/$HOME}"
if [[ ! -f "$VPS_SSH_KEY_PATH" ]]; then
  echo "error: SSH key not found: $VPS_SSH_KEY_PATH" >&2
  exit 1
fi

SSH_OPTS=(
  -i "$VPS_SSH_KEY_PATH"
  -p "$VPS_PORT"
  -o BatchMode=yes
  -o ConnectTimeout=30
  -o StrictHostKeyChecking=accept-new
)

REMOTE='
set -e
cd /var/www/clearform-backend

git checkout -- . 2>/dev/null || true
git pull origin main

bun install
rm -f package-lock.json
bunx prisma generate
'

if [[ "$RUN_MIGRATE" == "1" ]]; then
  REMOTE+='
npx prisma migrate deploy
'
fi

REMOTE+='
bun run build
test -f dist/src/main.js || { echo "error: dist/src/main.js missing after build" >&2; exit 1; }

if pm2 describe clearform-backend > /dev/null 2>&1; then
  pm2 restart clearform-backend --update-env
else
  pm2 start ecosystem.config.cjs
fi

pm2 save
'

echo "Deploying main to $VPS_USER@$VPS_HOST (port $VPS_PORT)..."
ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}" "bash -s" <<< "$REMOTE"
echo "Deploy finished. Check: curl -sS https://api.clearform.in/api/v1/health"
