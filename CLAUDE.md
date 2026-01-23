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
