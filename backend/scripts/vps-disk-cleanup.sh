#!/usr/bin/env bash
# Safe disk cleanup for Clearform VPS — keeps /var/www/clearform-backend intact.
# Run on VPS as root: bash scripts/vps-disk-cleanup.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/clearform-backend}"

echo "=== Disk before ==="
df -h /

echo "=== Trimming system logs (journald) ==="
journalctl --vacuum-time=3d 2>/dev/null || true
journalctl --vacuum-size=200M 2>/dev/null || true

echo "=== Cleaning apt cache ==="
apt-get clean 2>/dev/null || true
apt-get autoremove -y 2>/dev/null || true

echo "=== Removing old log files (>7 days) ==="
find /var/log -type f -name '*.log' -mtime +7 -delete 2>/dev/null || true
find /var/log -type f -name '*.gz' -mtime +7 -delete 2>/dev/null || true
find /var/log -type f -name '*.1' -mtime +3 -delete 2>/dev/null || true

echo "=== PM2 logs (often 10–90GB under /root/.pm2/logs) ==="
if [[ -d /root/.pm2 ]]; then
  du -sh /root/.pm2 2>/dev/null || true
fi
pm2 flush 2>/dev/null || true
# pm2 flush does not remove rotated files — delete log files directly
find /root/.pm2/logs -type f -delete 2>/dev/null || true
truncate -s 0 /root/.pm2/pm2.log 2>/dev/null || true
find /root/.pm2 -maxdepth 1 -type f -name '*.log' -exec truncate -s 0 {} + 2>/dev/null || true
if [[ -d /root/.pm2 ]]; then
  du -sh /root/.pm2 2>/dev/null || true
fi

echo "=== Bun / npm caches (not app dir) ==="
rm -rf /root/.bun/install/cache/* 2>/dev/null || true
rm -rf /root/.npm/_cacache 2>/dev/null || true
rm -rf /tmp/* 2>/dev/null || true

echo "=== Old backend build artifacts outside app (if any duplicate clones) ==="
for dir in /var/www/clearform-backend-old /var/www/clearform-backend.bak; do
  if [[ -d "$dir" ]]; then
    echo "Removing $dir"
    rm -rf "$dir"
  fi
done

if [[ -d "$APP_DIR/node_modules/.cache" ]]; then
  rm -rf "$APP_DIR/node_modules/.cache"
fi

echo "=== Disk after ==="
df -h /

echo "Done. Restart API: pm2 restart clearform-backend --update-env"
