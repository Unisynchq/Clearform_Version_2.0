#!/usr/bin/env bash
# iCloud Desktop/Documents sync creates "name 2" duplicate folders inside node_modules.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
count=0
while IFS= read -r dir; do
  rm -rf "$dir"
  count=$((count + 1))
done < <(find "$ROOT/node_modules" -name '* 2' -type d 2>/dev/null || true)
echo "Removed $count iCloud duplicate folder(s) under node_modules"
