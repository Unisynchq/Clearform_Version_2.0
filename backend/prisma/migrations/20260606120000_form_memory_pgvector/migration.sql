-- Enable pgvector and form-scoped memory chunks (Meta-Cognitive AI Platform Phase 3)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS form_memory_chunks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "formId" TEXT NOT NULL,
  "chunkType" TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS form_memory_chunks_form_id_idx ON form_memory_chunks ("formId");

CREATE INDEX IF NOT EXISTS form_memory_chunks_embedding_idx
  ON form_memory_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
