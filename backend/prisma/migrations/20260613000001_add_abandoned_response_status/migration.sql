-- Add ABANDONED status for partial/abandoned form sessions.
-- Used to track users who started a form but never reached the end screen.
ALTER TYPE "ResponseStatus" ADD VALUE 'ABANDONED';
