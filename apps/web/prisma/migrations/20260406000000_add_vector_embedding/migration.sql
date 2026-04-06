-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column (1536 dims for text-embedding-3-small)
ALTER TABLE analysis_history
ADD COLUMN embedding vector(1536);

-- Create HNSW index for fast approximate nearest neighbor search
CREATE INDEX analysis_history_embedding_idx
ON analysis_history
USING hnsw (embedding vector_cosine_ops);
