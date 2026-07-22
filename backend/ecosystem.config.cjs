/** PM2 process file — VPS: pm2 start ecosystem.config.cjs
 *
 * Cluster mode: spawns one worker per CPU core. All state lives in Postgres + Redis,
 * so workers share nothing in memory — rate limits and job queues (BullMQ) are
 * distributed via Redis automatically. The in-memory rate-limit fallback is intentionally
 * per-worker; it only activates when Redis is down (degraded mode).
 *
 * BullMQ note: multiple workers competing on the same queues is safe by design —
 * BullMQ uses Redis atomic operations to ensure each job is processed exactly once.
 *
 * Upstash connection budget: N workers × 4 queues × ~2 connections ≈ 8N connections.
 * At 4 cores = ~32 connections (well within the 100-connection free-tier limit).
 */
module.exports = {
  apps: [
    {
      name: 'clearform-backend',
      script: 'dist/src/main.js',
      cwd: '/var/www/clearform-backend',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      max_memory_restart: '400M',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      node_args: '--env-file=/var/www/clearform-backend/.env',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
