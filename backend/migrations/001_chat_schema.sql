-- Migration: 001_chat_schema.sql
-- AI Chat Interface for Estimate Generation
--
-- Prerequisites: Enable pgvector extension in Supabase SQL Editor:
--   CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- Document Embeddings Table
-- Stores vector embeddings for RAG
-- ============================================
CREATE TABLE IF NOT EXISTS document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding vector(1536), -- OpenAI text-embedding-ada-002 dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_embeddings_doc_id ON document_embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_embeddings_org_id ON document_embeddings(organization_id);

-- Vector similarity index (requires pgvector extension)
-- Note: Run this after the table has some data for better performance
CREATE INDEX IF NOT EXISTS idx_doc_embeddings_vector ON document_embeddings
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- Chat Conversations Table
-- Stores chat sessions
-- ============================================
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID,
    title TEXT,
    is_saved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_org_id ON chat_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_saved ON chat_conversations(is_saved);

-- ============================================
-- Chat Messages Table
-- Individual messages in conversations
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_embeddings
CREATE POLICY "Users can view their org's embeddings" ON document_embeddings
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for chat_conversations
CREATE POLICY "Users can view their org's conversations" ON chat_conversations
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert conversations in their org" ON chat_conversations
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own conversations" ON chat_conversations
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their org's conversations" ON chat_messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM chat_conversations
            WHERE organization_id IN (
                SELECT organization_id FROM organization_members
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert messages in their org's conversations" ON chat_messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM chat_conversations
            WHERE organization_id IN (
                SELECT organization_id FROM organization_members
                WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================
-- Updated_at Trigger for conversations
-- ============================================
DROP TRIGGER IF EXISTS update_chat_conversations_updated_at ON chat_conversations;
CREATE TRIGGER update_chat_conversations_updated_at
    BEFORE UPDATE ON chat_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RPC Function for Vector Similarity Search
-- ============================================
CREATE OR REPLACE FUNCTION match_document_embeddings(
    query_embedding vector(1536),
    match_org_id UUID,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    chunk_text TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        de.id,
        de.document_id,
        de.chunk_text,
        1 - (de.embedding <=> query_embedding) AS similarity
    FROM document_embeddings de
    WHERE de.organization_id = match_org_id
    ORDER BY de.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
