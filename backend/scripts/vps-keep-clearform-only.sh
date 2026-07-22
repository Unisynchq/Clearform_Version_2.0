#!/usr/bin/env bash
# Remove extra projects on VPS; keep ONLY /var/www/clearform-backend (+ minimal /var/www/html stub).
#
# Usage on VPS as root:
#   cd /var/www/clearform-backend && git pull origin main
#   DRY_RUN=1 bash scripts/vps-keep-clearform-only.sh   # preview
#   CONFIRM=YES bash scripts/vps-keep-clearform-only.sh # execute
#
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/clearform-backend}"
DRY_RUN="${DRY_RUN:-0}"
CONFIRM="${CONFIRM:-}"

remove_path() {
  local target="$1"
  if [[ ! -e "$target" ]]; then
    echo "[skip] not found: $target"
    return
  fi
  if [[ "$target" == "$APP_DIR" ]] || [[ "$target" == "$APP_DIR/"* ]]; then
    echo "[skip] protected: $target"
    return
  fi
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[dry-run] would remove: $target"
    du -sh "$target" 2>/dev/null || true
    return
  fi
  echo "[remove] $target"
  rm -rf "$target"
}

echo "=== Disk before ==="
df -h /

echo ""
echo "=== Paths to REMOVE (everything except clearform-backend) ==="

# Root home — old clones
remove_path /root/Clear-form--Landing-page-frontend
remove_path /root/UniSync-Backend-website

# /var/www — extra apps (keep clearform-backend only)
remove_path /var/www/UniSync-Backend-website
remove_path /var/www/clearform

# Default nginx html — often huge or duplicate static sites
if [[ -d /var/www/html ]]; then
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[dry-run] would clear /var/www/html (keep empty dir)"
    du -sh /var/www/html 2>/dev/null || true
  elif [[ "$CONFIRM" == "YES" ]]; then
    echo "[clear] /var/www/html contents"
    find /var/www/html -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    printf '%s\n' '<!DOCTYPE html><html><body>Clearform API</body></html>' > /var/www/html/index.html
  fi
fi

if [[ "$CONFIRM" != "YES" && "$DRY_RUN" != "1" ]]; then
  echo ""
  echo "Nothing deleted yet. To preview:"
  echo "  DRY_RUN=1 bash scripts/vps-keep-clearform-only.sh"
  echo "To execute removals + system cleanup:"
  echo "  CONFIRM=YES bash scripts/vps-keep-clearform-only.sh"
  exit 0
fi

if [[ "$DRY_RUN" == "1" ]]; then
  echo ""
  echo "Dry run complete. Run with CONFIRM=YES to apply."
  exit 0
fi

echo ""
echo "=== PM2: stop apps that are not clearform-backend ==="
if command -v pm2 >/dev/null 2>&1; then
  # grep exits 1 when no matches — must not abort under set -euo pipefail
  while read -r name; do
    if [[ "$name" != "clearform-backend" && -n "$name" ]]; then
      echo "[pm2] deleting process: $name"
      pm2 delete "$name" 2>/dev/null || true
    fi
  done < <(pm2 jlist 2>/dev/null | grep -o '"name":"[^"]*"' | cut -d'"' -f4 || true)
  pm2 save 2>/dev/null || true
fi

echo ""
echo "=== System + app disk cleanup ==="
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$SCRIPT_DIR/vps-disk-cleanup.sh"

echo ""
echo "=== Optimize clearform-backend footprint ==="
if [[ -d "$APP_DIR" ]]; then
  cd "$APP_DIR"
  rm -rf node_modules/.cache .turbo 2>/dev/null || true
  # Drop git history on server only (saves space; deploy uses git pull from origin)
  if [[ -d .git ]]; then
    git gc --aggressive --prune=now 2>/dev/null || true
  fi
fi

echo ""
echo "=== Disk after ==="
df -h /
echo ""
echo "=== Remaining in /var/www ==="
ls -la /var/www/
echo ""
echo "=== Remaining in /root ==="
ls -la /root/ | head -20
echo ""
echo "Done. Verify API: curl -sS https://api.clearform.in/api/v1/health"
