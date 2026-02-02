-- Migration: 005_pricing_enhancements.sql
-- Enhanced AI Estimator with Accurate Pricing
--
-- Adds pricing mode selection, section-aware chunking, and structured pricing extraction.

-- ============================================
-- Phase 1: Pricing Mode Selection on Conversations
-- ============================================

-- Track which pricing approach the user selected at conversation start
ALTER TABLE chat_conversations
ADD COLUMN IF NOT EXISTS pricing_mode TEXT DEFAULT 'pending';

-- Store any pricing assumptions the AI makes during estimation
ALTER TABLE chat_conversations
ADD COLUMN IF NOT EXISTS pricing_assumptions JSONB DEFAULT '{}';

-- Add comment explaining pricing_mode values
COMMENT ON COLUMN chat_conversations.pricing_mode IS
    'Pricing approach: pending (not selected), criteria (use labor rates/margins), historical (use document pricing), combined (both)';

-- ============================================
-- Phase 2: Section Metadata for Document Embeddings
-- ============================================

-- Add section metadata to embeddings for targeted queries
-- (These columns may already exist in metadata JSONB, but explicit columns enable faster filtering)

-- Index on metadata for section-based filtering
CREATE INDEX IF NOT EXISTS idx_doc_embeddings_metadata_section
ON document_embeddings USING GIN ((metadata->'section'));

-- ============================================
-- Phase 3: Structured Pricing Extraction Table
-- ============================================

CREATE TABLE IF NOT EXISTS document_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Project classification
    project_type TEXT,  -- bathroom, kitchen, full renovation, etc.
    project_date DATE,  -- Date from the document for inflation adjustments

    -- Pricing totals
    total_amount DECIMAL(12,2),
    labor_total DECIMAL(12,2),
    materials_total DECIMAL(12,2),

    -- Structured line items as JSONB array
    -- Each item: {category, item_name, quantity, unit, unit_cost, total_cost}
    line_items JSONB DEFAULT '[]',

    -- Extraction metadata
    confidence_score FLOAT DEFAULT 0.5,
    extraction_metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_doc_pricing_org_id ON document_pricing(organization_id);
CREATE INDEX IF NOT EXISTS idx_doc_pricing_project_type ON document_pricing(organization_id, project_type);
CREATE INDEX IF NOT EXISTS idx_doc_pricing_document_id ON document_pricing(document_id);

-- GIN index on line_items for category/item queries
CREATE INDEX IF NOT EXISTS idx_doc_pricing_line_items ON document_pricing USING GIN (line_items);

-- ============================================
-- Row Level Security for document_pricing
-- ============================================

ALTER TABLE document_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's pricing data" ON document_pricing
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert pricing data for their org" ON document_pricing
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their org's pricing data" ON document_pricing
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their org's pricing data" ON document_pricing
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- Updated_at Trigger for document_pricing
-- ============================================

DROP TRIGGER IF EXISTS update_document_pricing_updated_at ON document_pricing;
CREATE TRIGGER update_document_pricing_updated_at
    BEFORE UPDATE ON document_pricing
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RPC Function for Section-Filtered Vector Search
-- ============================================

CREATE OR REPLACE FUNCTION match_document_embeddings_by_section(
    query_embedding vector(1536),
    match_org_id UUID,
    match_section TEXT DEFAULT NULL,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    chunk_text TEXT,
    section TEXT,
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
        de.metadata->>'section' AS section,
        1 - (de.embedding <=> query_embedding) AS similarity
    FROM document_embeddings de
    WHERE de.organization_id = match_org_id
      AND (match_section IS NULL OR de.metadata->>'section' ILIKE '%' || match_section || '%')
    ORDER BY de.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ============================================
-- RPC Function to Get Historical Pricing by Category
-- ============================================

CREATE OR REPLACE FUNCTION get_historical_pricing(
    search_org_id UUID,
    search_project_type TEXT DEFAULT NULL,
    search_category TEXT DEFAULT NULL,
    result_limit INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    project_type TEXT,
    project_date DATE,
    total_amount DECIMAL(12,2),
    labor_total DECIMAL(12,2),
    materials_total DECIMAL(12,2),
    line_items JSONB,
    confidence_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dp.id,
        dp.document_id,
        dp.project_type,
        dp.project_date,
        dp.total_amount,
        dp.labor_total,
        dp.materials_total,
        CASE
            WHEN search_category IS NOT NULL THEN
                (SELECT jsonb_agg(item)
                 FROM jsonb_array_elements(dp.line_items) AS item
                 WHERE item->>'category' ILIKE '%' || search_category || '%')
            ELSE dp.line_items
        END AS line_items,
        dp.confidence_score
    FROM document_pricing dp
    WHERE dp.organization_id = search_org_id
      AND (search_project_type IS NULL OR dp.project_type ILIKE '%' || search_project_type || '%')
    ORDER BY dp.confidence_score DESC, dp.project_date DESC
    LIMIT result_limit;
END;
$$;

-- ============================================
-- RPC Function to Find Similar Projects for Estimation
-- ============================================

CREATE OR REPLACE FUNCTION find_similar_projects(
    search_org_id UUID,
    scope_keywords TEXT[],
    result_limit INT DEFAULT 3
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    project_type TEXT,
    project_date DATE,
    total_amount DECIMAL(12,2),
    labor_total DECIMAL(12,2),
    materials_total DECIMAL(12,2),
    line_items JSONB,
    match_score INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dp.id,
        dp.document_id,
        dp.project_type,
        dp.project_date,
        dp.total_amount,
        dp.labor_total,
        dp.materials_total,
        dp.line_items,
        -- Score based on keyword matches in project_type and line_items
        (
            CASE WHEN dp.project_type ILIKE ANY(SELECT '%' || k || '%' FROM unnest(scope_keywords) k) THEN 2 ELSE 0 END +
            (SELECT COUNT(*)::INT FROM jsonb_array_elements(dp.line_items) item
             WHERE item->>'category' ILIKE ANY(SELECT '%' || k || '%' FROM unnest(scope_keywords) k)
                OR item->>'item_name' ILIKE ANY(SELECT '%' || k || '%' FROM unnest(scope_keywords) k))
        ) AS match_score
    FROM document_pricing dp
    WHERE dp.organization_id = search_org_id
    ORDER BY match_score DESC, dp.confidence_score DESC, dp.project_date DESC
    LIMIT result_limit;
END;
$$;

-- ============================================
-- Grant execute permissions on new RPC functions
-- ============================================

GRANT EXECUTE ON FUNCTION match_document_embeddings_by_section TO authenticated;
GRANT EXECUTE ON FUNCTION get_historical_pricing TO authenticated;
GRANT EXECUTE ON FUNCTION find_similar_projects TO authenticated;
