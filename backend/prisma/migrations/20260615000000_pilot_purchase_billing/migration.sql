-- Pilot purchase (Payment Link) + subscription receipt field
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "razorpayPaymentId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_razorpayPaymentId_key" ON "Subscription"("razorpayPaymentId");

CREATE TABLE IF NOT EXISTS "PilotPurchase" (
    "id" TEXT NOT NULL,
    "razorpayPaymentId" TEXT NOT NULL,
    "razorpayOrderId" TEXT,
    "razorpayPaymentLinkId" TEXT,
    "email" TEXT,
    "amountPaise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PilotPurchase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PilotPurchase_razorpayPaymentId_key" ON "PilotPurchase"("razorpayPaymentId");
CREATE UNIQUE INDEX IF NOT EXISTS "PilotPurchase_userId_key" ON "PilotPurchase"("userId");

ALTER TABLE "PilotPurchase" DROP CONSTRAINT IF EXISTS "PilotPurchase_userId_fkey";
ALTER TABLE "PilotPurchase" ADD CONSTRAINT "PilotPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
