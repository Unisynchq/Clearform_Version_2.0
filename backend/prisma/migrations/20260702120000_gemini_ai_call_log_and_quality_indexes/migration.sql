-- Observability for the Gemini provider rollout: one row per resolved LLM attempt.
-- CreateTable
CREATE TABLE "ai_call_logs" (
    "id" TEXT NOT NULL,
    "formId" TEXT,
    "task" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "promptTokens" INTEGER,
    "outputTokens" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorSnippet" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_call_logs_createdAt_idx" ON "ai_call_logs"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "ai_call_logs_provider_task_createdAt_idx" ON "ai_call_logs"("provider", "task", "createdAt" DESC);

-- Backs the nightly Cleo learning scan of negative feedback per form.
-- CreateIndex
CREATE INDEX "AiFeedback_formId_rating_createdAt_idx" ON "AiFeedback"("formId", "rating", "createdAt");

-- Backs GET /analytics/forms/:formId/top-responses (ordered by qualityScore).
-- CreateIndex
CREATE INDEX "FormResponse_formId_qualityScore_idx" ON "FormResponse"("formId", "qualityScore" DESC);

-- Normalise a drifted index name so future prisma diffs stay clean.
-- RenameIndex
ALTER INDEX "form_memory_chunks_form_id_idx" RENAME TO "form_memory_chunks_formId_idx";
