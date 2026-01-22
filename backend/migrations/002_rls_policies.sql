-- REMODLY Row Level Security Policies
-- Run after 000_schema.sql and 001_waitlist.sql

-- ============================================
-- Helper function to check org membership
-- ============================================
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Organizations Policies
-- ============================================

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access to organizations" ON organizations;
CREATE POLICY "Service role full access to organizations"
    ON organizations FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Members can view their organizations
DROP POLICY IF EXISTS "Members can view their organizations" ON organizations;
CREATE POLICY "Members can view their organizations"
    ON organizations FOR SELECT
    TO authenticated
    USING (is_org_member(id));

-- Admins can update their organizations
DROP POLICY IF EXISTS "Admins can update their organizations" ON organizations;
CREATE POLICY "Admins can update their organizations"
    ON organizations FOR UPDATE
    TO authenticated
    USING (is_org_admin(id))
    WITH CHECK (is_org_admin(id));

-- ============================================
-- Organization Members Policies
-- ============================================

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access to organization_members" ON organization_members;
CREATE POLICY "Service role full access to organization_members"
    ON organization_members FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Members can view other members in their org
DROP POLICY IF EXISTS "Members can view org members" ON organization_members;
CREATE POLICY "Members can view org members"
    ON organization_members FOR SELECT
    TO authenticated
    USING (is_org_member(organization_id));

-- Admins can add/remove members
DROP POLICY IF EXISTS "Admins can manage org members" ON organization_members;
CREATE POLICY "Admins can manage org members"
    ON organization_members FOR ALL
    TO authenticated
    USING (is_org_admin(organization_id))
    WITH CHECK (is_org_admin(organization_id));

-- ============================================
-- Company Profiles Policies
-- ============================================

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access to company_profiles" ON company_profiles;
CREATE POLICY "Service role full access to company_profiles"
    ON company_profiles FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Members can view their company profile
DROP POLICY IF EXISTS "Members can view company profile" ON company_profiles;
CREATE POLICY "Members can view company profile"
    ON company_profiles FOR SELECT
    TO authenticated
    USING (is_org_member(organization_id));

-- Admins can update company profile
DROP POLICY IF EXISTS "Admins can update company profile" ON company_profiles;
CREATE POLICY "Admins can update company profile"
    ON company_profiles FOR UPDATE
    TO authenticated
    USING (is_org_admin(organization_id))
    WITH CHECK (is_org_admin(organization_id));

-- ============================================
-- Documents Policies
-- ============================================

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access to documents" ON documents;
CREATE POLICY "Service role full access to documents"
    ON documents FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Members can view their org's documents
DROP POLICY IF EXISTS "Members can view documents" ON documents;
CREATE POLICY "Members can view documents"
    ON documents FOR SELECT
    TO authenticated
    USING (is_org_member(organization_id));

-- Members can create documents
DROP POLICY IF EXISTS "Members can create documents" ON documents;
CREATE POLICY "Members can create documents"
    ON documents FOR INSERT
    TO authenticated
    WITH CHECK (is_org_member(organization_id));

-- Members can update their org's documents
DROP POLICY IF EXISTS "Members can update documents" ON documents;
CREATE POLICY "Members can update documents"
    ON documents FOR UPDATE
    TO authenticated
    USING (is_org_member(organization_id))
    WITH CHECK (is_org_member(organization_id));

-- Admins can delete documents
DROP POLICY IF EXISTS "Admins can delete documents" ON documents;
CREATE POLICY "Admins can delete documents"
    ON documents FOR DELETE
    TO authenticated
    USING (is_org_admin(organization_id));

-- ============================================
-- Pricing Profiles Policies
-- ============================================

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access to pricing_profiles" ON pricing_profiles;
CREATE POLICY "Service role full access to pricing_profiles"
    ON pricing_profiles FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Members can view pricing profile
DROP POLICY IF EXISTS "Members can view pricing profile" ON pricing_profiles;
CREATE POLICY "Members can view pricing profile"
    ON pricing_profiles FOR SELECT
    TO authenticated
    USING (is_org_member(organization_id));

-- Admins can update pricing profile
DROP POLICY IF EXISTS "Admins can update pricing profile" ON pricing_profiles;
CREATE POLICY "Admins can update pricing profile"
    ON pricing_profiles FOR UPDATE
    TO authenticated
    USING (is_org_admin(organization_id))
    WITH CHECK (is_org_admin(organization_id));

-- ============================================
-- Labor Items Policies
-- ============================================

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access to labor_items" ON labor_items;
CREATE POLICY "Service role full access to labor_items"
    ON labor_items FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Members can view labor items
DROP POLICY IF EXISTS "Members can view labor items" ON labor_items;
CREATE POLICY "Members can view labor items"
    ON labor_items FOR SELECT
    TO authenticated
    USING (is_org_member(organization_id));

-- Members can create labor items
DROP POLICY IF EXISTS "Members can create labor items" ON labor_items;
CREATE POLICY "Members can create labor items"
    ON labor_items FOR INSERT
    TO authenticated
    WITH CHECK (is_org_member(organization_id));

-- Members can update labor items
DROP POLICY IF EXISTS "Members can update labor items" ON labor_items;
CREATE POLICY "Members can update labor items"
    ON labor_items FOR UPDATE
    TO authenticated
    USING (is_org_member(organization_id))
    WITH CHECK (is_org_member(organization_id));

-- Admins can delete labor items
DROP POLICY IF EXISTS "Admins can delete labor items" ON labor_items;
CREATE POLICY "Admins can delete labor items"
    ON labor_items FOR DELETE
    TO authenticated
    USING (is_org_admin(organization_id));

-- ============================================
-- Style Presets Policies
-- ============================================

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access to style_presets" ON style_presets;
CREATE POLICY "Service role full access to style_presets"
    ON style_presets FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Members can view style presets
DROP POLICY IF EXISTS "Members can view style presets" ON style_presets;
CREATE POLICY "Members can view style presets"
    ON style_presets FOR SELECT
    TO authenticated
    USING (is_org_member(organization_id));

-- Members can create style presets
DROP POLICY IF EXISTS "Members can create style presets" ON style_presets;
CREATE POLICY "Members can create style presets"
    ON style_presets FOR INSERT
    TO authenticated
    WITH CHECK (is_org_member(organization_id));

-- Members can update style presets
DROP POLICY IF EXISTS "Members can update style presets" ON style_presets;
CREATE POLICY "Members can update style presets"
    ON style_presets FOR UPDATE
    TO authenticated
    USING (is_org_member(organization_id))
    WITH CHECK (is_org_member(organization_id));

-- Admins can delete style presets
DROP POLICY IF EXISTS "Admins can delete style presets" ON style_presets;
CREATE POLICY "Admins can delete style presets"
    ON style_presets FOR DELETE
    TO authenticated
    USING (is_org_admin(organization_id));
