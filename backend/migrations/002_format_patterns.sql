-- Migration: 002_format_patterns.sql
-- Document Format Patterns Table for learning company document styles

CREATE TABLE IF NOT EXISTS document_format_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    section_headers TEXT[] DEFAULT '{}',
    numbering_style TEXT DEFAULT 'decimal',
    terminology JSONB DEFAULT '{}',
    structure JSONB DEFAULT '{}',
    pricing_format TEXT,
    boilerplate_text TEXT,
    confidence_score FLOAT DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_format_patterns_doc_id ON document_format_patterns(document_id);
CREATE INDEX IF NOT EXISTS idx_format_patterns_org_id ON document_format_patterns(organization_id);

ALTER TABLE document_format_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's format patterns" ON document_format_patterns
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );
