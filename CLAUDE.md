# CLAUDE.md - Project Context for AI Assistants

## Project Overview

**REMODLY** is an AI-powered in-home estimator for general contractors. The platform enables contractors to:
1. Upload documents (contracts, cost sheets) to train the system on their pricing
2. Configure pricing rules and style presets
3. Generate instant estimates from LiDAR scans (via mobile app)
4. Share estimates with homeowners and collect signatures

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         REMODLY Platform                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │   Frontend   │    │   Backend    │    │   Mobile App     │  │
│  │  (React/TS)  │◄──►│  (FastAPI)   │◄──►│  (iOS/Swift)     │  │
│  │              │    │              │    │  [Separate Repo] │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│         │                   │                                   │
│         └───────────┬───────┘                                   │
│                     ▼                                           │
│              ┌──────────────┐                                   │
│              │   Supabase   │                                   │
│              │  - Auth      │                                   │
│              │  - Postgres  │                                   │
│              │  - Storage   │                                   │
│              └──────────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.11+ |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| AI/LLM | OpenAI GPT-4 (document extraction) |
| Mobile | iOS Swift/SwiftUI (separate repository) |

## Repository Structure

```
/
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── common/     # Buttons, containers, etc.
│   │   │   ├── layout/     # Navigation, footer
│   │   │   ├── sections/   # Page sections (Hero, etc.)
│   │   │   └── ui/         # UI primitives
│   │   ├── pages/          # Page components
│   │   │   ├── auth/       # Login, signup pages
│   │   │   └── dashboard/  # Contractor portal pages
│   │   ├── contexts/       # React contexts (auth, etc.)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities (supabase client, api)
│   │   └── types/          # TypeScript definitions
│   └── ...
│
├── backend/                # FastAPI backend application
│   ├── app/
│   │   ├── api/v1/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── schemas/        # Pydantic models (request/response)
│   │   ├── models/         # Database models (reference)
│   │   ├── main.py         # FastAPI app entry
│   │   ├── config.py       # Settings & env vars
│   │   └── dependencies.py # Shared dependencies
│   └── requirements.txt
│
├── docs/                   # Documentation
│   └── remodly-full-description.md  # Full product spec
│
└── README.md
```

## Key Patterns

### Backend (FastAPI)

1. **Modular Monolith**: Services are organized as separate modules but deployed together
2. **Dependency Injection**: Use FastAPI's `Depends()` for auth and org validation
3. **Supabase Integration**: All database operations go through Supabase client
4. **Async Services**: All service methods are async for better performance

```python
# Example endpoint pattern
@router.get("/{org_id}/profile")
async def get_profile(
    org_id: str,
    current_org_id: str = Depends(get_current_org_id),  # Auth check
):
    if org_id != current_org_id:
        raise HTTPException(status_code=403)
    return await service.get_profile(org_id)
```

### Frontend (React)

1. **Component Structure**: Atomic design (common → ui → sections → pages)
2. **State Management**: React Context for auth/org, local state for forms
3. **Styling**: Tailwind CSS with custom theme colors (obsidian, copper, sage)
4. **Animations**: Framer Motion for transitions, GSAP for complex sequences

```typescript
// Example protected route pattern
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  }
/>
```

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `organizations` | Contractor companies |
| `organization_members` | User-org relationships with roles |
| `company_profiles` | Company branding, contact info |
| `documents` | Uploaded contracts, cost sheets |
| `pricing_profiles` | Labor rates, markups, margins |
| `labor_items` | Individual line items with rates |
| `style_presets` | Design presets for mobile app |

## Environment Variables

### Backend (.env)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
OPENAI_API_KEY=xxx
JWT_SECRET=xxx
```

### Frontend (.env)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_API_URL=http://localhost:8000
```

## Development Commands

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Register user + create org |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Get current user |
| GET | `/api/v1/organizations/{id}/profile` | Get company profile |
| PATCH | `/api/v1/organizations/{id}/profile` | Update company profile |
| GET | `/api/v1/organizations/{id}/documents` | List documents |
| POST | `/api/v1/organizations/{id}/documents` | Create document |
| GET | `/api/v1/organizations/{id}/pricing` | Get pricing rules |
| PATCH | `/api/v1/organizations/{id}/pricing` | Update pricing rules |
| GET | `/api/v1/organizations/{id}/labor-items` | List labor items |
| POST | `/api/v1/organizations/{id}/labor-items` | Create labor item |

## MVP Use Case Flow

1. **Contractor Onboarding (Web)**
   - Signup → Create organization
   - Upload documents (contracts, cost sheets)
   - Configure pricing rules
   - Set up style presets

2. **Field Visit (Mobile - Future)**
   - Scan room with LiDAR
   - Extract quantities automatically
   - Select style preset
   - Generate estimate via backend API
   - Share with homeowner

3. **Homeowner (Web)**
   - View shared estimate link
   - See 3 style options with prices
   - Download PDF
   - Sign digitally (future)

## Common Tasks

### Adding a new API endpoint
1. Create schema in `backend/app/schemas/`
2. Add service method in `backend/app/services/`
3. Create endpoint in `backend/app/api/v1/`
4. Register in router if new file

### Adding a new frontend page
1. Create page component in `frontend/src/pages/`
2. Add route in `App.tsx`
3. Create any needed components in `frontend/src/components/`

### Database changes
1. Write SQL migration
2. Run in Supabase SQL Editor
3. Update relevant schemas/services
