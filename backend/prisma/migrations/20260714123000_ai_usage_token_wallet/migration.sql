-- Account-level LLM token wallet (prompt + completion), finite per plan period.
ALTER TABLE "ai_usage" ADD COLUMN "aiTokensUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ai_usage" ADD COLUMN "aiTokensPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
