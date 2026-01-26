# Addendum Writer Project

## Overview

This project contains a specialized agent (`addendum-generator`) designed to generate professional home improvement addendum documents. The agent transforms short user descriptions of work into fully written addendum documents matching company standards.

## Project Structure

```
addendum_writer/
├── CLAUDE.md           # Project documentation and instructions
├── agent_context.md    # Agent behavior and rules definition
├── examples/           # Approved addendum templates (SOURCE OF TRUTH)
├── input/              # User-uploaded job description documents
├── output/             # Generated addendum documents
└── skills/             # Agent skills
    ├── pricing/          # Price estimation skill
    ├── document-input/   # Document processing skill
    └── job-order-spanish/ # Spanish job order generation skill
```

## Agent Behavior

### What the Agent Does
- Transforms short work descriptions into complete addendum documents
- Matches formatting, structure, and tone of files in `/examples`
- Generates `.docx` (Microsoft Word) output files

### What the Agent Does NOT Do
- Evaluate feasibility
- Interpret building code
- Redesign scope
- Add suggestions or recommendations

### Pricing Estimates
For price estimates and quotes, follow the guidance in `/skills/pricing/SKILL.md`. This skill enables:
- Generating price estimates based on historical addendum data
- Providing price ranges (low/mid/high) with confidence levels
- Tracking and reporting assumptions transparently

### Spanish Job Orders (Órdenes de Trabajo)
For generating Spanish-language job orders for subcontractors, follow the guidance in `/skills/job-order-spanish/SKILL.md`. This skill enables:
- Translating addendum scope items into Spanish work descriptions
- Generating rough materials lists organized by trade/section
- Creating field-ready documentation for Spanish-speaking workers

**Input sources:**
- Upload addendum to `/input/` folder, OR
- Reference existing addendums in `/output/` folder

**Output:** `.docx` files saved to `/output/` with naming `orden-trabajo-[project]-YYYY-MM-DD.docx`

## Usage

### Input Options

**Option 1: Text Description**
Provide a short description of the work:
- "Bathroom remodel with new tile and vanity"
- "Add recessed lights and relocate outlets"
- "Kitchen cabinet replacement and countertop"
- "Frame a new wall and add a door"

**Option 2: Document Upload**
Place a `.docx` file in the `/input/` folder containing the job description. The agent will:
- Extract text content from the document
- Extract and analyze any embedded images (photos, diagrams, floor plans)
- Use vision capabilities to identify room details, materials, and existing conditions
- Combine text and image analysis to understand the full scope

See `/skills/document-input/SKILL.md` for detailed processing instructions.

### Invoking the Agent
Use the `addendum-generator` agent when users need scope documents for:
- Home improvement projects
- Change orders
- Phase scope definitions
- Renovation work documentation

## Important Rules

1. **Examples are the source of truth** - Files in `/examples` define all standards for structure, wording, formatting, and tone

2. **Never modify examples** - The `/examples` folder is read-only reference material

3. **Output format** - All generated documents must be `.docx` files

4. **No explanations in output** - Final documents contain only addendum text, no commentary

5. **Conservative assumptions** - When details are unknown, phrase scope items neutrally

## File Locations

| Folder | Purpose | Permissions |
|--------|---------|-------------|
| `/examples` | Approved addendum templates | Read-only |
| `/input` | User-uploaded job description documents | Read |
| `/output` | Generated addendum documents | Write |
| `/skills` | Agent skills and instructions | Read-only |

## Success Criteria

A successful output is indistinguishable from an addendum written by the same author as the example files, differing only in scope content based on the user's description.
