-- Compare-and-swap guard for the builder autosave endpoint: without a
-- version, two overlapping autosave PUT requests can resolve out of order
-- and silently revert a newer edit to an older draft.
ALTER TABLE "Form" ADD COLUMN "builderSnapshotVersion" INTEGER NOT NULL DEFAULT 0;
