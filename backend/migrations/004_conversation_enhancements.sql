-- Migration: 004_conversation_enhancements.sql
-- Auto-Save and Catalogue AI Estimator Conversations
--
-- Enables automatic conversation persistence and retrieval so the AI agent
-- can track what has been discussed with each user across sessions.

-- ============================================
-- Add new columns to chat_conversations
-- ============================================

-- AI-generated conversation summary for quick retrieval
ALTER TABLE chat_conversations
ADD COLUMN IF NOT EXISTS summary TEXT;

-- Auto-extracted project categories (bathroom, kitchen, etc.)
ALTER TABLE chat_conversations
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Denormalized count for display efficiency
ALTER TABLE chat_conversations
ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;

-- Structured project details extracted by AI
ALTER TABLE chat_conversations
ADD COLUMN IF NOT EXISTS project_context JSONB DEFAULT '{}';

-- ============================================
-- Full-text Search Configuration
-- ============================================

-- Create a function to generate tsvector from title and summary
CREATE OR REPLACE FUNCTION chat_conversations_search_vector(title TEXT, summary TEXT)
RETURNS tsvector
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN
        setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(summary, '')), 'B');
END;
$$;

-- Add a generated column for full-text search
ALTER TABLE chat_conversations
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (chat_conversations_search_vector(title, summary)) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_chat_conversations_search
ON chat_conversations USING GIN (search_vector);

-- Index on tags for array searches
CREATE INDEX IF NOT EXISTS idx_chat_conversations_tags
ON chat_conversations USING GIN (tags);

-- ============================================
-- RPC Function for Conversation Search
-- ============================================

CREATE OR REPLACE FUNCTION search_conversations(
    search_query TEXT,
    search_org_id UUID,
    search_user_id UUID,
    result_limit INT DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    organization_id UUID,
    user_id UUID,
    title TEXT,
    summary TEXT,
    tags TEXT[],
    message_count INTEGER,
    project_context JSONB,
    is_saved BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    rank FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cc.id,
        cc.organization_id,
        cc.user_id,
        cc.title,
        cc.summary,
        cc.tags,
        cc.message_count,
        cc.project_context,
        cc.is_saved,
        cc.created_at,
        cc.updated_at,
        ts_rank(cc.search_vector, plainto_tsquery('english', search_query)) AS rank
    FROM chat_conversations cc
    WHERE cc.organization_id = search_org_id
      AND cc.user_id = search_user_id
      AND cc.search_vector @@ plainto_tsquery('english', search_query)
    ORDER BY rank DESC, cc.updated_at DESC
    LIMIT result_limit;
END;
$$;

-- ============================================
-- RPC Function to Get Relevant Past Context
-- ============================================

CREATE OR REPLACE FUNCTION get_relevant_conversations(
    search_query TEXT,
    search_org_id UUID,
    search_user_id UUID,
    exclude_conversation_id UUID DEFAULT NULL,
    result_limit INT DEFAULT 3
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    summary TEXT,
    tags TEXT[],
    project_context JSONB,
    updated_at TIMESTAMPTZ,
    rank FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cc.id,
        cc.title,
        cc.summary,
        cc.tags,
        cc.project_context,
        cc.updated_at,
        ts_rank(cc.search_vector, plainto_tsquery('english', search_query)) AS rank
    FROM chat_conversations cc
    WHERE cc.organization_id = search_org_id
      AND cc.user_id = search_user_id
      AND cc.summary IS NOT NULL
      AND (exclude_conversation_id IS NULL OR cc.id != exclude_conversation_id)
      AND (
          cc.search_vector @@ plainto_tsquery('english', search_query)
          OR cc.tags && string_to_array(search_query, ' ')::TEXT[]
      )
    ORDER BY rank DESC, cc.updated_at DESC
    LIMIT result_limit;
END;
$$;

-- ============================================
-- Trigger to Update Message Count
-- ============================================

CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE chat_conversations
        SET message_count = message_count + 1
        WHERE id = NEW.conversation_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE chat_conversations
        SET message_count = GREATEST(0, message_count - 1)
        WHERE id = OLD.conversation_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_message_count ON chat_messages;
CREATE TRIGGER trigger_update_message_count
    AFTER INSERT OR DELETE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_message_count();

-- ============================================
-- Backfill existing conversations with message counts
-- ============================================

UPDATE chat_conversations cc
SET message_count = (
    SELECT COUNT(*)::INTEGER
    FROM chat_messages cm
    WHERE cm.conversation_id = cc.id
)
WHERE cc.message_count IS NULL OR cc.message_count = 0;

-- ============================================
-- Grant execute permissions on RPC functions
-- ============================================

GRANT EXECUTE ON FUNCTION search_conversations TO authenticated;
GRANT EXECUTE ON FUNCTION get_relevant_conversations TO authenticated;
