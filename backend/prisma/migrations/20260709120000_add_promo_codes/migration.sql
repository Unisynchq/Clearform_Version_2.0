-- Promo code trial: single shared invite-only code, 7-day pilot trial.
-- Uniqueness is enforced on PromoRedemption.userId (one trial per account),
-- not on the code itself, since many invited people share one code string.

-- CreateEnum
CREATE TYPE "SubscriptionSource" AS ENUM ('RAZORPAY', 'PROMO');

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "source" "SubscriptionSource" NOT NULL DEFAULT 'RAZORPAY';

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "redemptionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoRedemption" (
    "id" TEXT NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedExpiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PromoRedemption_userId_key" ON "PromoRedemption"("userId");

-- AddForeignKey
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Deliberately no seed INSERT here: this repo is public, so the real invite
-- code must never be committed to git. Seed/rotate it out-of-band (Prisma
-- Studio or a direct `psql`/SQL session against the database), not via a
-- migration file. See ops runbook for the current active code.
