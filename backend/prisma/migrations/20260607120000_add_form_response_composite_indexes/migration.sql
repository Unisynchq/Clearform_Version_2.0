-- Add composite indexes to FormResponse for analytics range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "FormResponse_formId_createdAt_idx"
  ON "FormResponse" ("formId", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "FormResponse_formId_status_idx"
  ON "FormResponse" ("formId", "status");
