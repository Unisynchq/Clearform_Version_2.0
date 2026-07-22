-- Per-user AI spend auditability: cost estimate + owning user on every call row.
-- AlterTable
ALTER TABLE "ai_call_logs" ADD COLUMN "ownerUserId" TEXT;
ALTER TABLE "ai_call_logs" ADD COLUMN "costUsd" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "ai_call_logs_ownerUserId_createdAt_idx" ON "ai_call_logs"("ownerUserId", "createdAt" DESC);
