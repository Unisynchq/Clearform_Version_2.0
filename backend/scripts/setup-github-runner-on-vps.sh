#!/usr/bin/env bash
# One-time: install a self-hosted GitHub Actions runner on the VPS so deploy.yml runs locally
# (same steps as deploy-vps.sh, without SSH from github.com runners).
#
# From your Mac (SSH must already work):
#   VPS_HOST=147.93.96.250 VPS_USER=root VPS_SSH_KEY_PATH=~/.ssh/github_actions_vps ./scripts/setup-github-runner-on-vps.sh
#
# Registration token (expires ~1 hour):
#   Option A — gh CLI on your Mac:  USE_GH_TOKEN=1 ./scripts/setup-github-runner-on-vps.sh ...
#   Option B — GitHub UI: Settings → Actions → Runners → New self-hosted runner → copy the full --token value

set -euo pipefail

REPO_SLUG="${REPO_SLUG:-CoderRahul01/Clearform-backend-main}"

VPS_HOST="${VPS_HOST:-}"
VPS_USER="${VPS_USER:-${VPS_USERNAME:-root}}"
VPS_SSH_KEY_PATH="${VPS_SSH_KEY_PATH:-}"
VPS_PORT="${VPS_PORT:-22}"
RUNNER_VERSION="${RUNNER_VERSION:-2.327.1}"
REPO_URL="${REPO_URL:-https://github.com/${REPO_SLUG}}"
RUNNER_NAME="${RUNNER_NAME:-clearform-vps}"
RUNNER_LABELS="${RUNNER_LABELS:-clearform-vps}"
RUNNER_DIR="${RUNNER_DIR:-/var/www/clearform-backend/actions-runner}"

# Auto-fetch a fresh registration token when gh is available (unless token already set).
if [[ -z "${GITHUB_RUNNER_TOKEN:-}" ]]; then
  if command -v gh >/dev/null 2>&1; then
    echo "Fetching registration token via gh for ${REPO_SLUG} ..."
    GITHUB_RUNNER_TOKEN=$(gh api "repos/${REPO_SLUG}/actions/runners/registration-token" -X POST --jq .token)
  fi
elif [[ "${USE_GH_TOKEN:-}" == "1" ]] && command -v gh >/dev/null 2>&1; then
  echo "Refreshing registration token via gh for ${REPO_SLUG} ..."
  GITHUB_RUNNER_TOKEN=$(gh api "repos/${REPO_SLUG}/actions/runners/registration-token" -X POST --jq .token)
fi

if [[ -z "${GITHUB_RUNNER_TOKEN:-}" ]]; then
  echo "error: set GITHUB_RUNNER_TOKEN or run with USE_GH_TOKEN=1 and gh auth login" >&2
  echo "  UI: Repo → Settings → Actions → Runners → New self-hosted runner → copy the full --token= value" >&2
  exit 1
fi

if [[ ${#GITHUB_RUNNER_TOKEN} -lt 20 ]]; then
  echo "error: GITHUB_RUNNER_TOKEN looks truncated (need the full token from GitHub, not a placeholder like AXXXXXXXX)" >&2
  exit 1
fi

if [[ "$GITHUB_RUNNER_TOKEN" == *YOUR_TOKEN* || "$GITHUB_RUNNER_TOKEN" == *paste-token* || "$GITHUB_RUNNER_TOKEN" == *XXXXXXXX* ]]; then
  echo "error: replace GITHUB_RUNNER_TOKEN with a real registration token (or USE_GH_TOKEN=1 with gh)" >&2
  exit 1
fi

if [[ -z "$VPS_HOST" || -z "$VPS_SSH_KEY_PATH" ]]; then
  echo "error: set VPS_HOST and VPS_SSH_KEY_PATH to run this installer over SSH from your Mac" >&2
  exit 1
fi

VPS_SSH_KEY_PATH="${VPS_SSH_KEY_PATH/#\~/$HOME}"

# Quoted heredoc avoids the local shell parsing `case` / `;;` in the remote script.
REMOTE_BODY=$(cat <<'REMOTE_EOF'
set -euo pipefail

# SSH installs as root; GitHub runner requires this env var (see actions/runner docs).
export RUNNER_ALLOW_RUNASROOT=1

apt-get update -qq
apt-get install -y -qq curl jq libicu-dev 2>/dev/null || true

mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

if [[ ! -f ./config.sh ]]; then
  arch=$(uname -m)
  if [[ "$arch" == "x86_64" ]]; then
    runner_arch=x64
  elif [[ "$arch" == "aarch64" || "$arch" == "arm64" ]]; then
    runner_arch=arm64
  else
    echo "unsupported arch: $arch" >&2
    exit 1
  fi
  tarball="actions-runner-linux-${runner_arch}-${RUNNER_VERSION}.tar.gz"
  curl -fsSL -o "$tarball" "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${tarball}"
  tar xzf "$tarball"
  rm -f "$tarball"
fi

if [[ -f ./svc.sh ]] && ./svc.sh status 2>/dev/null | grep -q 'active'; then
  echo "Runner service already active in $RUNNER_DIR"
  ./run.sh --check 2>/dev/null || true
  exit 0
fi

# Partial install from a failed run — re-configure with a fresh token if needed.
if [[ -f ./config.sh ]] && [[ -f ./.runner ]]; then
  echo "Runner already configured in $RUNNER_DIR; starting service only."
  ./svc.sh install
  ./svc.sh start
  ./svc.sh status
  exit 0
fi

./config.sh --unattended \
  --url "$REPO_URL" \
  --token "$GITHUB_RUNNER_TOKEN" \
  --name "$RUNNER_NAME" \
  --labels "$RUNNER_LABELS" \
  --work "_work" \
  --replace

./svc.sh install
./svc.sh start
./svc.sh status
echo "Self-hosted runner online. Push to main will run .github/workflows/deploy.yml on this host."
REMOTE_EOF
)

REMOTE_SCRIPT=$(cat <<EOF
set -euo pipefail
RUNNER_VERSION=$(printf '%q' "$RUNNER_VERSION")
REPO_URL=$(printf '%q' "$REPO_URL")
RUNNER_NAME=$(printf '%q' "$RUNNER_NAME")
RUNNER_LABELS=$(printf '%q' "$RUNNER_LABELS")
RUNNER_DIR=$(printf '%q' "$RUNNER_DIR")
GITHUB_RUNNER_TOKEN=$(printf '%q' "$GITHUB_RUNNER_TOKEN")
export RUNNER_VERSION REPO_URL RUNNER_NAME RUNNER_LABELS RUNNER_DIR GITHUB_RUNNER_TOKEN

$REMOTE_BODY
EOF
)

echo "Installing GitHub Actions runner on ${VPS_USER}@${VPS_HOST} ..."
ssh -i "$VPS_SSH_KEY_PATH" -p "$VPS_PORT" -o BatchMode=yes -o StrictHostKeyChecking=accept-new \
  "${VPS_USER}@${VPS_HOST}" bash -s <<< "$REMOTE_SCRIPT"
