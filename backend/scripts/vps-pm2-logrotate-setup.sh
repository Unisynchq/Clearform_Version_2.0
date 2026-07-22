#!/usr/bin/env bash
# One-time PM2 log rotation so /root/.pm2 does not grow to tens of GB again.
# Run on VPS as root after clearing logs: bash scripts/vps-pm2-logrotate-setup.sh
set -euo pipefail

if ! command -v pm2 >/dev/null 2>&1; then
  echo "pm2 not found"
  exit 1
fi

pm2 install pm2-logrotate 2>/dev/null || pm2 reload pm2-logrotate

pm2 set pm2-logrotate:max_size 20M
pm2 set pm2-logrotate:retain 5
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
pm2 set pm2-logrotate:workerInterval 30

echo "pm2-logrotate configured (max 20M per file, keep 5, compress)."
pm2 conf pm2-logrotate 2>/dev/null || true
