# LiteLLM Proxy — Clearform VPS setup

Follows [LiteLLM Docker quick start](https://docs.litellm.ai/docs/proxy/docker_quick_start).

NestJS calls only `LITELLM_BASE_URL` (`llm-gateway.service.ts`). LiteLLM routes to **Ollama** (local) then **OpenRouter** `:free` models.

## Prerequisites (done on VPS)

```bash
# Ollama on host — CPU mode OK on 8GB KVM
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.2:3b
systemctl status ollama   # should be active
curl http://127.0.0.1:11434/api/tags   # lists llama3.2:3b
```

## 1. Env vars (`/var/www/clearform-backend/.env`)

```env
LITELLM_BASE_URL=http://127.0.0.1:4000
LITELLM_MASTER_KEY=sk-<generate-a-long-random-value>
OPENROUTER_API_KEY=sk-or-v1-...
```

Quotes are **optional** — unquoted values work (`OPENROUTER_API_KEY=sk-or-v1-...`). Spaces around `=` and trailing `# comments` on the same line are fine. Do not put the full NestJS `.env` in this folder; `./start.sh` copies only `OPENROUTER_API_KEY`, `LITELLM_MASTER_KEY`, and `OLLAMA_API_BASE` into a local `.env.compose` for `docker compose --env-file`.

`LITELLM_MASTER_KEY` is required by `main-latest` for `/v1/chat/completions`. NestJS sends the same key via `llm-gateway.service.ts`.

## ⚠️ SECURITY — CVE-2026-42271 (CVSS 8.7, active exploitation)

**Action required before running LiteLLM on VPS.**

Two MCP test endpoints (`POST /mcp-rest/test/connection`, `POST /mcp-rest/test/tools/list`) in LiteLLM < 1.83.7 allow any authenticated user to spawn arbitrary subprocesses on the host. Chained with Starlette CVE-2026-48710 (host-header auth bypass, CVSS 6.5), this becomes **unauthenticated RCE** (combined CVSS 10.0).

**Mitigation steps (do all three):**

**Step 1 — Use pinned image (already in docker-compose.yml)**

`docker.litellm.ai/berriai/litellm:v1.83.7-stable.patch.1` — patches both CVEs. Do not revert to `main-latest`.
Tag format is `v{version}-stable[.patch.N]` — the `main-v*` format does not exist.

**Step 2 — Block port 4000 externally on VPS firewall**

```bash
# UFW — allow only loopback (NestJS at 127.0.0.1 can still reach :4000)
sudo ufw deny in on eth0 to any port 4000
sudo ufw status numbered
```

**Step 3 — Block the two MCP endpoints at nginx**

In `/etc/nginx/sites-available/clearform-api` (or equivalent), add inside the `server {}` block:

```nginx
location ~* ^/mcp-rest/test/ {
    deny all;
    return 403;
}
```

Then `sudo nginx -t && sudo systemctl reload nginx`.

**Step 4 — Rotate credentials** stored in LiteLLM env:
- `LITELLM_MASTER_KEY` — generate a new key, update VPS `.env` and NestJS env
- `OPENROUTER_API_KEY` — rotate in OpenRouter dashboard if LiteLLM was publicly reachable

---

## 2. Pull image & start proxy

```bash
cd /var/www/clearform-backend/docker/litellm
docker pull docker.litellm.ai/berriai/litellm:v1.83.7-stable.patch.1
./start.sh          # reads ../../.env → .env.compose → compose up (not DATABASE_URL)
docker compose logs -f --tail=50
```

Logs should show: `Loaded config YAML` with `model_list`.

## 3. Smoke tests

```bash
# Health
curl -sS http://127.0.0.1:4000/health/liveliness

# Ollama path (clearform-fast alias)
curl -sS http://127.0.0.1:4000/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${LITELLM_MASTER_KEY:-}" \
  -d '{
    "model": "clearform-fast",
    "messages": [{"role": "user", "content": "Reply with one word: ok"}],
    "max_tokens": 10
  }'
```

## 4. Restart Clearform API

```bash
cd /var/www/clearform-backend
pm2 restart clearform-backend --update-env
curl -sS https://api.clearform.in/api/v1/health
```

## 5. Purge stale AI insights cache

In Upstash (or redis-cli): delete keys matching `analytics:insights:*` (v2 keys use `analytics:insights:v2:`).

## Model aliases (NestJS → LiteLLM)

| NestJS task | LiteLLM alias (free) | Try first | Fallback |
|-------------|----------------------|-----------|----------|
| Response quality | `clearform-free-fast` | Ollama llama3.2:3b | OpenRouter Llama 3.2 3B |
| AI Insights | `clearform-free-insights` | OpenRouter Qwen 2.5 7B | OpenRouter Llama 3.2 3B |
| Logic generate | `clearform-free-logic` | OpenRouter Qwen 2.5 7B | OpenRouter Llama 3.3 70B (fallback only) |

## Ollama + Docker on Linux

Ollama binds to `127.0.0.1:11434` by default. Bridge-networked containers cannot reach it.

This compose uses **`network_mode: host`** so LiteLLM shares the host loopback (`OLLAMA_API_BASE=http://127.0.0.1:11434`).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Ollama unreachable from container | Use `network_mode: host` (this repo) or set `OLLAMA_HOST=0.0.0.0` in Ollama systemd and use bridge + `host-gateway`. |
| `OPENROUTER_API_KEY` variable is not set (Compose WARN) | Always use `./start.sh` (not bare `docker compose up`). It writes `.env.compose` from `../../.env`. |
| LiteLLM hangs on Prisma migrate | Never pass NestJS `DATABASE_URL` into the LiteLLM container — `./start.sh` only forwards proxy keys. |
| OpenRouter 429 on `:free` | Normal under load; Ollama absorbs typing traffic. Retry or add OpenRouter credits. |
| 401 from LiteLLM | Set `LITELLM_MASTER_KEY` in `.env` and pass same key from NestJS. |
| Proxy down | API falls back to OpenRouter direct, then rule-based heuristics. |

## Optional (not required tonight)

- **Virtual keys + RPM limits**: needs Postgres + `ghcr.io/berriai/litellm-database` image — see LiteLLM docs.
- **Prometheus**: only if you add monitoring stack.
