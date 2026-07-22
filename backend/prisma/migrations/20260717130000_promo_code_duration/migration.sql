-- Per-code trial duration; NULL falls back to the default trial length in code.
ALTER TABLE "PromoCode" ADD COLUMN "durationDays" INTEGER;
