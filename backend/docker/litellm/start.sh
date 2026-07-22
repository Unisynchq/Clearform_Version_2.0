#!/usr/bin/env bash
# Start LiteLLM on VPS — reads proxy vars from ../../.env into .env.compose for Compose interpolation
set -euo pipefail
cd "$(dirname "$0")"
ENV_FILE="../../.env"
COMPOSE_ENV=".env.compose"

read_env() {
  local key="$1"
  local line val
  [[ -f "$ENV_FILE" ]] || return 0
  line="$(
    grep -E "^[[:space:]]*(export[[:space:]]+)?${key}[[:space:]]*=" "$ENV_FILE" 2>/dev/null \
      | grep -Ev '^[[:space:]]*#' \
      | head -1
  )" || return 0
  [[ -n "$line" ]] || return 0
  line="${line#export}"
  line="${line#"${line%%[![:space:]]*}"}"
  val="${line#*=}"
  val="${val#"${val%%[![:space:]]*}"}"
  val="${val//$'\r'/}"
  if [[ "$val" =~ ^"(.*)"$ ]]; then
    val="${BASH_REMATCH[1]}"
  elif [[ "$val" =~ ^'"'"'(.*)'"'"'$ ]]; then
    val="${BASH_REMATCH[1]}"
  else
    val="${val%%#*}"
    val="${val%"${val##*[![:space:]]}"}"
  fi
  printf '%s' "$val"
}

OPENROUTER_API_KEY="$(read_env OPENROUTER_API_KEY)"
LITELLM_MASTER_KEY="$(read_env LITELLM_MASTER_KEY)"
OLLAMA_API_BASE="${OLLAMA_API_BASE:-$(read_env OLLAMA_API_BASE)}"
OLLAMA_API_BASE="${OLLAMA_API_BASE:-http://127.0.0.1:11434}"
REDIS_HOST="$(read_env REDIS_HOST)"
REDIS_PORT="$(read_env REDIS_PORT)"
REDIS_PASSWORD="$(read_env REDIS_PASSWORD)"

if [[ -z "${OPENROUTER_API_KEY}" ]]; then
  echo "OPENROUTER_API_KEY missing in $ENV_FILE (quotes optional; e.g. OPENROUTER_API_KEY=sk-or-v1-...)" >&2
  exit 1
fi

umask 077
{
  printf 'OPENROUTER_API_KEY=%s\n' "$OPENROUTER_API_KEY"
  printf 'LITELLM_MASTER_KEY=%s\n' "${LITELLM_MASTER_KEY:-}"
  printf 'OLLAMA_API_BASE=%s\n' "$OLLAMA_API_BASE"
  printf 'REDIS_HOST=%s\n' "${REDIS_HOST:-}"
  printf 'REDIS_PORT=%s\n' "${REDIS_PORT:-6379}"
  printf 'REDIS_PASSWORD=%s\n' "${REDIS_PASSWORD:-}"
} > "$COMPOSE_ENV"

docker compose --env-file "$COMPOSE_ENV" up -d "$@"
