-- Migration: 003_typography_colors.sql
-- Add typography and colors columns to document_format_patterns
-- for storing rich formatting metadata extracted from documents

ALTER TABLE document_format_patterns
ADD COLUMN IF NOT EXISTS typography JSONB DEFAULT '{}';
-- Stores: {
--   "fonts": ["Arial", "Calibri"],
--   "heading_styles": {"Heading 1": {"font": "Arial", "size": 16, "bold": true}},
--   "text_emphasis": {"bold_count": 12, "italic_count": 5},
--   "primary_font": "Arial",
--   "heading_font": "Arial Bold",
--   "body_font": "Calibri"
-- }

ALTER TABLE document_format_patterns
ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '{}';
-- Stores: {
--   "text_colors": ["#000000", "#333333"],
--   "heading_color": "#1F4E79",
--   "accent_color": "#D4AF37",
--   "background_colors": ["#FFFFFF"]
-- }
