# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**REMODLY** is an AI-powered in-home estimator for general contractors. The platform enables contractors to:
1. Upload documents (contracts, cost sheets) to train the system on their pricing
2. Configure pricing rules and style presets
3. Generate instant estimates from LiDAR scans (via mobile app)
4. Share estimates with homeowners and collect signatures

## Development Commands

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload          # Run dev server at http://localhost:8000
# API docs available at http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev      # Run dev server at http://localhost:5173
npm run build    # Type-check (tsc) and build for production
npm run lint     # Run ESLint
```

## Architecture

```
Frontend (React/TS) ◄──► Backend (FastAPI) ◄──► Supabase (Auth, Postgres, Storage)
                                            ◄──► Mobile App (iOS/Swift - separate repo)
```

| Component | Technology |
|-----------|------------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.11+ |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| AI/LLM | OpenAI GPT-4 (document extraction) |

## Key Patterns

### Backend (FastAPI)
- **Dependency Injection**: Use FastAPI's `Depends()` for auth and org validation
- **Async Services**: All service methods are async
- **Supabase Integration**: All database operations go through Supabase client

```python
@router.get("/{org_id}/profile")
async def get_profile(
    org_id: str,
    current_org_id: str = Depends(get_current_org_id),
):
    if org_id != current_org_id:
        raise HTTPException(status_code=403)
    return await service.get_profile(org_id)
```

### Frontend (React)
- **Component Structure**: Atomic design (common → ui → sections → pages)
- **State Management**: React Context for auth/org, local state for forms
- **Styling**: Tailwind CSS with custom theme colors (obsidian, copper, sage)
- **Animations**: Framer Motion for transitions, GSAP for complex sequences
- **Protected Routes**: Use `<ProtectedRoute>` wrapper for authenticated pages

## Adding New Features

### New API endpoint
1. Create schema in `backend/app/schemas/`
2. Add service method in `backend/app/services/`
3. Create endpoint in `backend/app/api/v1/`
4. Register in router if new file

### New frontend page
1. Create page component in `frontend/src/pages/`
2. Add route in `App.tsx`
3. Create any needed components in `frontend/src/components/`

### Database changes
1. Write SQL migration
2. Run in Supabase SQL Editor
3. Update relevant schemas/services

## Environment Variables

### Backend (.env)
```
SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, OPENAI_API_KEY
```

### Frontend (.env)
```
VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_API_URL
```

## Git Conventions

When asked to add, commit, or push changes:
- **Do NOT include** the `Co-Authored-By: Claude` signature in commit messages
- Use descriptive commit messages with a summary line and bullet points for details

## Debugging Guide

### Methodology: Always Examine Both Layers

When debugging issues where "data doesn't display correctly", investigate BOTH:

1. **Data Layer** (Backend/API/State)
   - Is the API returning complete data?
   - Is state being updated correctly?
   - Check browser DevTools Network tab for API responses
   - Add `console.log` to verify state contents

2. **Rendering Layer** (React/CSS/Animations)
   - Is the component receiving the data?
   - Are there CSS issues (visibility, opacity, display)?
   - Are animations interfering with visibility?
   - Check browser DevTools Elements tab for computed styles

### Case Study: Document Upload Empty Row Bug

**Symptom**: After uploading a document, an empty row appeared in the list. Document only visible after page refresh.

**Initial (Wrong) Hypothesis**: Backend API not returning complete data from Supabase insert.

**Actual Root Cause**: Framer Motion animation issue. New list items got `initial="hidden"` (opacity: 0) but the parent was already in "visible" state, so children never animated to visible.

**Key Evidence That Pointed to Animation**:
- Document count increased (data WAS in state)
- Row took up space (element WAS rendered)
- Content was invisible (stuck at opacity: 0)
- Refresh fixed it (triggered fresh animation sequence)

**Fix**: Added `key={documents.length}` to force list remount on changes:
```jsx
<motion.div
  key={documents.length}  // Forces remount, triggering animation
  variants={staggerList}
  initial="hidden"
  animate="visible"
>
```

**Lesson**: When something "exists but is invisible", check the rendering layer (CSS, animations) not just the data layer.

### Framer Motion: Dynamic Lists

When using Framer Motion with lists that change dynamically:

**Problem Pattern**:
```jsx
<motion.div initial="hidden" animate="visible">
  {items.map(item => (
    <motion.div key={item.id} variants={childVariant}>  // New items stay hidden!
```

**Solutions**:
1. **Key on parent** (simple): `key={items.length}` forces remount
2. **AnimatePresence** (better UX): Proper enter/exit animations for dynamic content
```jsx
<AnimatePresence initial={false}>
  {items.map(item => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
```
