# Pricing Estimation Skill

## Purpose
Generate price estimates for new home improvement scopes based on historical addendum pricing data.

## What Estimates Include

**Included in estimates:**
- Labor costs
- Rough materials (framing lumber, drywall, wiring, plumbing supplies, etc.)

**NOT included (client-supplied):**
- Finish materials (tile, flooring, fixtures, appliances, vanities, countertops, lighting fixtures, hardware, paint colors, etc.)

## When to Use This Skill
- User asks for a price quote or estimate for new work
- User describes a scope of work for a new client
- User asks "how much would X cost" or similar

## Required Inputs
1. **Scope Description**: What work needs to be done
2. **Reference Files**: Access to historical addendums with pricing (in /mnt/user-data/uploads or project files)

## Process

### Step 1: Understand the Request
Parse the user's scope description to identify:
- Work type (kitchen, bathroom, flooring, roofing, electrical, plumbing, etc.)
- Approximate size/scale
- Material preferences (if mentioned)
- Any special requirements

### Step 2: Search Reference Data
Read through available addendum files and extract:
- Final pricing from each addendum
- Scope details for comparison
- Date of the work (for inflation adjustment)

Use this extraction pattern when reading addendums:
```
Look for pricing sections typically found at:
- End of document
- "Total" or "Contract Sum" lines
- Line item breakdowns
- Payment schedules
```

### Step 3: Calculate Estimate
1. Find 2-3 most similar reference projects
2. Calculate base price from references
3. Apply adjustments:
   - Size scaling (not linear - use 0.8 factor for economies of scale)
   - Material upgrades/downgrades (±15-30%)
   - Complexity factors
   - Time-based inflation (3-5% per year)

### Step 4: Format Response
Always include:
1. **Price range** (low/mid/high)
2. **References used** (which addendums informed the estimate)
3. **Assumptions list** (CRITICAL - always be transparent)
4. **Confidence level** (high/medium/low based on reference similarity)

## Assumptions Tracking

**ALWAYS** track and report assumptions. Common categories:

| Category | Default Assumption | Flag When |
|----------|-------------------|-----------|
| Square Footage | Use reference average | User didn't specify size |
| Material Grade | Standard/mid-grade | User didn't specify materials |
| Demolition | Included | User didn't mention existing conditions |
| Permits | Not included | Varies by jurisdiction |
| Timeline | Standard (not rush) | User didn't specify urgency |
| Access | Normal access | User didn't mention access issues |
| Finish Materials | Not included (client-supplied) | Always clarify this |

## Example Interaction

**User**: "I need a price for a bathroom remodel for a new client. They want new tile, vanity, and fixtures. It's a standard master bathroom."

**Agent Response**:
```
## Bathroom Remodel Estimate

### Scope
Full bathroom remodel including tile, vanity, and fixtures for a master bathroom.

### Estimated Range
- **Conservative:** $8,500
- **Mid-Range:** $12,000  
- **Premium:** $16,500

### Based On
- Johnson Residence bathroom (2024) - $11,200
- Miller Project master bath (2023) - $9,800 (adjusted +4% for inflation = $10,192)

### What's Included
**Note:** This estimate covers labor and rough materials only. Finish materials (tile, vanity, fixtures, etc.) are client-supplied and not included.

### Assumptions Made
⚠️ **Please verify these assumptions:**
1. **Size**: Assumed ~50-60 sq ft (standard master bath)
2. **Demo**: Full demo of existing materials included
3. **Plumbing**: No relocation of plumbing fixtures
4. **Permits**: Not included in estimate

### To Refine This Estimate
- What are the bathroom dimensions?
- Any preference on tile type (ceramic, porcelain, natural stone)?
- Tub/shower configuration (tub, shower only, tub/shower combo)?
```

## Error Handling

- **No similar references**: State this clearly, provide very rough estimate with wide range, suggest getting actual quotes
- **Incomplete scope**: List what's missing, provide estimate with clearly stated assumptions
- **Outdated references only**: Apply inflation adjustment, note the age of references

## Output Document Generation

**REQUIRED**: Every price estimate MUST  be allowd to be exported as a `.docx` or a .pdf file.
### Document Naming Convention
`price-estimate-YYYY-MM-DD.docx`

If multiple estimates are generated on the same day, append a sequence number:
- `price-estimate-2026-01-02.docx`
- `price-estimate-2026-01-02-2.docx`
- `price-estimate-2026-01-02-3.docx`

### Document Generation Process

1. **After calculating the estimate**, generate a Word document using the `document-skills:docx` skill
2. **Document structure** should include:
   - Title: "Price Estimate"
   - Date and project description
   - Scope summary (all items being estimated)
   - Price tables with Low/Mid/High columns
   - Subtotals by category
   - Combined total estimate table
   - What's Included section
   - What's NOT Included section
   - Assumptions Made section
   - References Used (if applicable)
   - Footer with generation date



