-- CreateTable: AiFeedback — stores form builder corrections to AI quality decisions.
-- Feeds the Cleo learning pipeline (Track 4).
CREATE TABLE "AiFeedback" (
    "id"           TEXT NOT NULL,
    "formId"       TEXT NOT NULL,
    "responseId"   TEXT NOT NULL,
    "screenId"     TEXT,
    "rating"       INTEGER NOT NULL,
    "note"         TEXT,
    "aiDecision"   TEXT NOT NULL,
    "actualAnswer" TEXT,
    "createdBy"    TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiFeedback_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AiFeedback" ADD CONSTRAINT "AiFeedback_formId_fkey"
    FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiFeedback" ADD CONSTRAINT "AiFeedback_responseId_fkey"
    FOREIGN KEY ("responseId") REFERENCES "FormResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "AiFeedback_formId_createdAt_idx" ON "AiFeedback"("formId", "createdAt");
CREATE INDEX "AiFeedback_responseId_idx" ON "AiFeedback"("responseId");
