#!/usr/bin/env bash
# Production health probe — API, Qdrant, and Redis/BullMQ.
# Run from VPS or CI: API_BASE=https://api.clearform.in/api/v1 bash scripts/verify-api-health.sh
set -euo pipefail

PASS=0
FAIL=0

check() {
  local label="$1" code="$2" expected="$3"
  if [[ "$code" == "$expected" ]]; then
    echo "OK   $label → HTTP $code"
    ((PASS++)) || true
  else
    echo "FAIL $label → HTTP $code (expected $expected)"
    ((FAIL++)) || true
  fi
}

# ── 1. API health ──────────────────────────────────────────────────────────────
API_BASE="${API_BASE:-https://api.clearform.in/api/v1}"
HEALTH_URL="${API_BASE}/health"
code="$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 10 "$HEALTH_URL" || echo "000")"
check "API  $HEALTH_URL" "$code" "200"

# ── 2. Qdrant collection health ────────────────────────────────────────────────
QDRANT_URL="${QDRANT_URL:-http://localhost:6333}"
QDRANT_COLLECTION="cleo_platform_rules"

if [[ -n "${QDRANT_URL:-}" ]]; then
  qdrant_code="$(curl -sS -o /tmp/qdrant_resp.json -w "%{http_code}" \
    --connect-timeout 5 \
    "${QDRANT_URL}/collections/${QDRANT_COLLECTION}" || echo "000")"
  check "Qdrant collection '${QDRANT_COLLECTION}'" "$qdrant_code" "200"

  if [[ "$qdrant_code" == "200" ]]; then
    points_count="$(python3 -c "import json,sys; d=json.load(open('/tmp/qdrant_resp.json')); print(d.get('result',{}).get('points_count','?'))" 2>/dev/null || echo "?")"
    echo "     Qdrant points in collection: ${points_count}"
    if [[ "$points_count" == "0" ]]; then
      echo "WARN Qdrant collection is empty — Cleo nightly job may not have run with corrections yet"
    fi
  fi
else
  echo "SKIP Qdrant check (QDRANT_URL not set)"
fi

# ── 3. Redis / BullMQ queue depth ─────────────────────────────────────────────
if command -v redis-cli &>/dev/null && [[ -n "${REDIS_URL:-}" ]]; then
  for queue in "cleo-learning" "ai-quality" "response" "webhook"; do
    wait_len="$(redis-cli -u "$REDIS_URL" LLEN "bull:${queue}:wait" 2>/dev/null || echo "err")"
    failed_len="$(redis-cli -u "$REDIS_URL" LLEN "bull:${queue}:failed" 2>/dev/null || echo "err")"
    echo "INFO Queue '${queue}': waiting=${wait_len} failed=${failed_len}"
    if [[ "$failed_len" =~ ^[0-9]+$ ]] && (( failed_len > 0 )); then
      echo "WARN Queue '${queue}' has ${failed_len} failed job(s) — check PM2 logs"
      ((FAIL++)) || true
    fi
  done
else
  echo "SKIP Redis queue check (redis-cli not found or REDIS_URL not set)"
fi

# ── Summary ────────────────────────────────────────────────────────────────────
echo ""
echo "Result: ${PASS} passed, ${FAIL} failed"

if (( FAIL > 0 )); then
  echo "See docs/api-health-runbook.md for remediation steps"
  exit 1
fi
exit 0
