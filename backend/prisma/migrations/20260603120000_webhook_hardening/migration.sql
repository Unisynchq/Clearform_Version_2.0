-- Webhook hardening: delivery status, signing secret, delivery log

ALTER TABLE "Webhook" ADD COLUMN IF NOT EXISTS "secret" TEXT;
ALTER TABLE "Webhook" ADD COLUMN IF NOT EXISTS "lastDeliveredAt" TIMESTAMP(3);
ALTER TABLE "Webhook" ADD COLUMN IF NOT EXISTS "lastError" TEXT;

CREATE TABLE IF NOT EXISTS "WebhookDelivery" (
  "id" TEXT NOT NULL,
  "webhookId" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "statusCode" INTEGER,
  "success" BOOLEAN NOT NULL DEFAULT false,
  "error" TEXT,
  "attempt" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WebhookDelivery_webhookId_createdAt_idx"
  ON "WebhookDelivery"("webhookId", "createdAt" DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WebhookDelivery_webhookId_fkey'
  ) THEN
    ALTER TABLE "WebhookDelivery"
      ADD CONSTRAINT "WebhookDelivery_webhookId_fkey"
      FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
