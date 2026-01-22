# REMODLY

AI-powered in-home estimator for general contractors. Scan a room with LiDAR, get instant estimates, and close deals on the spot.

## Overview

REMODLY helps general contractors streamline their estimation process:

1. **Contractors** upload past estimates and configure pricing rules via the web portal
2. **Project managers** scan rooms with the mobile app (iOS LiDAR)
3. **Homeowners** receive instant estimates with 3D visualizations and can sign digitally

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                            REMODLY                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │   Frontend   │    │   Backend    │    │   Mobile App     │  │
│  │  React/Vite  │◄──►│   FastAPI    │◄──►│   iOS/Swift      │  │
│  │  TypeScript  │    │   Python     │    │   (Separate)     │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│                             │                                    │
│                      ┌──────┴──────┐                            │
│                      │  Supabase   │                            │
│                      │  - Auth     │                            │
│                      │  - Postgres │                            │
│                      │  - Storage  │                            │
│                      └─────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.11+ |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| AI/LLM | OpenAI GPT-4 |

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account

### 1. Clone the repository

```bash
git clone https://github.com/juanjtov/byai_26.git

```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the database schema (see `docs/` or use the SQL below)
3. Create storage buckets: `documents`, `snapshots`, `pdfs`
4. Copy your project URL and keys

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Run the server
uvicorn app.main:app --reload
```

Backend runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Run the dev server
npm run dev
```

Frontend runs at: http://localhost:5173

## Environment Variables

### Backend (.env)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
JWT_SECRET=your-jwt-secret
```

### Frontend (.env)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8000
```

## Database Schema

Run this SQL in Supabase SQL Editor:

```sql
-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Company profiles
CREATE TABLE company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  company_name TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  license_number TEXT,
  primary_color TEXT DEFAULT '#C88D74',
  secondary_color TEXT DEFAULT '#7A9E7E',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT DEFAULT 'pending',
  extracted_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing profiles
CREATE TABLE pricing_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  labor_rate_per_hour DECIMAL(10,2),
  overhead_markup DECIMAL(5,2) DEFAULT 0.15,
  profit_margin DECIMAL(5,2) DEFAULT 0.10,
  minimum_charge DECIMAL(10,2),
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Labor items
CREATE TABLE labor_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Style presets
CREATE TABLE style_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_type TEXT DEFAULT 'bathroom',
  palette JSONB,
  materials JSONB,
  fixture_style TEXT,
  lighting_preset TEXT,
  thumbnail_url TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_presets ENABLE ROW LEVEL SECURITY;
```

## Project Structure

```
/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── pages/      # Page components
│   │   ├── contexts/   # React contexts
│   │   ├── hooks/      # Custom hooks
│   │   └── lib/        # Utilities
│   └── package.json
│
├── backend/            # FastAPI backend
│   ├── app/
│   │   ├── api/v1/     # API endpoints
│   │   ├── services/   # Business logic
│   │   ├── schemas/    # Pydantic models
│   │   └── main.py     # App entry
│   └── requirements.txt
│
├── docs/               # Documentation
├── CLAUDE.md           # AI assistant context
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Register + create org |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Current user |
| GET/PATCH | `/api/v1/organizations/{id}/profile` | Company profile |
| GET/POST | `/api/v1/organizations/{id}/documents` | Documents |
| GET/PATCH | `/api/v1/organizations/{id}/pricing` | Pricing rules |
| GET/POST/PATCH/DELETE | `/api/v1/organizations/{id}/labor-items` | Labor items |

## License

MIT
