-- Action-based AI credits replace raw LLM token wallet.
ALTER TABLE "ai_usage" RENAME COLUMN "aiTokensUsed" TO "aiCreditsUsed";
ALTER TABLE "ai_usage" RENAME COLUMN "aiTokensPeriodStart" TO "aiCreditsPeriodStart";

-- Old token balances are not convertible — reset everyone to a clean credit wallet.
UPDATE "ai_usage" SET "aiCreditsUsed" = 0, "aiCreditsPeriodStart" = CURRENT_TIMESTAMP;

CREATE TABLE "ai_credit_ledger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "formId" TEXT,
    "status" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_credit_ledger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_credit_ledger_userId_createdAt_idx" ON "ai_credit_ledger"("userId", "createdAt" DESC);
CREATE INDEX "ai_credit_ledger_formId_createdAt_idx" ON "ai_credit_ledger"("formId", "createdAt" DESC);

ALTER TABLE "ai_credit_ledger" ADD CONSTRAINT "ai_credit_ledger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
