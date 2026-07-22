#!/usr/bin/env bash
# Defense-in-depth CORS config for the Firebase/GCS response-uploads bucket.
# Downloads no longer depend on this (the frontend uses a direct anchor
# click, not fetch()), but any future code path that does fetch() the file
# (thumbnailing, etc.) needs this or it will fail cross-origin.
#
# Usage: FIREBASE_STORAGE_BUCKET=<bucket> ./scripts/apply-storage-cors.sh
set -euo pipefail

BUCKET="${FIREBASE_STORAGE_BUCKET:?Set FIREBASE_STORAGE_BUCKET to the bucket name (same value used by the server)}"
CORS_FILE="$(dirname "$0")/storage-cors.json"

# Edit scripts/storage-cors.json's "origin" list to match the production
# CORS_ORIGIN env value before running this against a prod bucket.
gsutil cors set "$CORS_FILE" "gs://${BUCKET}"
gsutil cors get "gs://${BUCKET}"
