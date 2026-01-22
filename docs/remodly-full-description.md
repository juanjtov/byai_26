## **Product specification**

### **Product goal**

A project manager walks into a home, scans the room with an iPhone or iPad LiDAR device, and within minutes shows the homeowner three style options with instant 3D snapshots, plus a rough estimate generated in the contractor’s own estimate format, plus a share link and PDF.

### **Users**

1. Contractor admin  
    Sets up the company profile, uploads past estimates, configures pricing rules, and publishes brand templates and style presets.

2. Project manager in field  
    Runs the mobile app, scans the room, confirms scope inputs, presents three options, generates estimate and share link.

3. Homeowner  
    Views three options, sees a ballpark and rough scope, chooses a direction, can sign if enabled.

---

## **MVP scope and boundaries**

### **MVP includes**

1. iOS LiDAR capture using RoomPlan

2. Room model to quantities extraction for 1 room type at launch, bathroom recommended

3. Three style presets with instant on device snapshots

4. Rough estimate for labor and rough materials using contractor inputs plus learned company format

5. Finish allowance ranges by category using cached web price bands

6. PDF generation in the contractor’s template and a homeowner share link

### **MVP excludes**

1. Photoreal cloud “after” images as the default output

2. Full home multi room stitching

3. Android LiDAR or AR capture

4. Full 3D reconfiguration, structural changes, custom cabinetry layouts

5. Automatic permit or code compliance decisions

---

## **Onsite flow specification**

### **Step 1 Create job**

1. PM opens mobile app

2. Selects existing project or creates a new one

3. Chooses room type, bathroom

4. Adds notes or voice input for scope

### **Step 2 Scan capture**

1. App starts RoomPlan capture

2. App enforces scan checklist

   1. Scan full perimeter

   2. Capture openings

   3. Capture fixtures

   4. Capture ceiling

3. App computes a scan quality score

4. App stores the raw RoomPlan output

### **Step 3 Quantity extraction and validation**

1. App derives quantities from the room model

   1. Floor area

   2. Wall area

   3. Perimeter length

   4. Ceiling height

   5. Door count and sizes

   6. Window count and sizes

   7. Fixture counts when available, otherwise PM confirms

2. App shows an edit screen for overrides

3. App produces a locked Quantity Sheet version for pricing

### **Step 4 Style selection and instant render**

1. App shows three style cards

   1. Sophisticated

   2. Antique

   3. European

2. Each style maps to a Style Preset

   1. Palette

   2. Material set identifiers

   3. Fixture style direction

   4. Lighting preset

3. App applies the style preset to the 3D scene

4. App renders 3 to 6 snapshots from fixed camera angles

   1. Entry corner view

   2. Opposite corner view

   3. Vanity view

   4. Shower or tub view if present

5. App shows results immediately and allows toggling between styles

### **Step 5 Estimate generation**

1. App sends scope inputs plus quantities plus selected style to backend

2. Backend generates a contractor formatted estimate

   1. Rough labor

   2. Rough materials

   3. Allowances for finishes by category

3. App displays a clear breakdown

   1. Rough labor and rough materials total

   2. Finish allowance range

   3. Assumptions and exclusions

4. PM taps Generate PDF and Share Link

### **Step 6 Share and optional signature**

1. Backend creates a homeowner share page

2. Homeowner can view

   1. Three design options

   2. Chosen option

   3. Budget range and scope

   4. PDF

3. Optional signature flow locks the estimate version and stores signed documents

---

## **Mobile application specification**

### **Platform**

iOS native app, Swift, SwiftUI

### **Core frameworks**

1. RoomPlan for LiDAR capture and parametric room model

2. ARKit and RealityKit for scene rendering and snapshots

3. Metal for performance if needed, optional for MVP

### **Mobile responsibilities**

1. Authentication and tenant selection

2. Job creation and basic scope capture

3. RoomPlan capture and scan quality scoring

4. Quantity Sheet generation and manual overrides

5. On device scene assembly from RoomPlan output

6. Style preset application to materials and lighting

7. Instant snapshot rendering and caching

8. Sync artifacts to backend

9. Display estimate, PDF, and share link

### **Offline behavior**

1. Scan, quantities, and instant snapshots must work offline

2. Upload and estimate generation queue when online

3. A job is considered ready to present if it has

   1. Scan

   2. Quantity Sheet locked

   3. Local snapshots for 3 styles

4. If offline, app can still present visuals and a local rough estimate range if you include a minimal offline pricing profile, optional

---

## **Web application specification**

### **Contractor web portal**

Mobile first responsive web app

1. Company profile and branding

2. Upload documents

3. Review extracted estimate data

4. Edit and lock company estimating profile

5. Manage labor rates, production assumptions, markups, minimum charges

6. Manage templates for PDF output

7. Manage style presets

8. View estimates, versions, and audit logs

### **Homeowner share page**

1. Shows three options and selected option

2. Shows estimate summary and allowance ranges

3. Shows assumptions and exclusions

4. Displays PDF

5. Signature if enabled

---

## **FastAPI backend architecture**

### **High level services**

You can deploy these as separate services or a modular monolith. MVP should start as a modular monolith with clear boundaries.

1. API Gateway and Auth service  
    FastAPI routes, auth, tenancy, rate limiting, signed URLs.

2. Scan service  
    Accepts scan artifacts, stores RoomPlan JSON, stores derived quantities, tracks scan quality, versions.

3. Company documents ingestion service  
    Processes uploaded PDFs, extracts line items and sections, normalizes into canonical estimate objects.

4. Company schema builder service  
    Builds the contractor estimating profile and mappings that match their formats.

5. Estimating agent orchestrator  
    Turns new scope into a structured estimate that matches contractor format. Uses retrieval over company documents and the locked profile.

6. Deterministic pricing engine  
    Applies labor rates, production assumptions, markups, taxes, minimum charges. Outputs totals plus audit trail.

7. Finish allowance engine  
    Returns cached price bands per category by region and style tier, then computes allowance ranges.

8. Design preset service  
    Stores style presets and material sets. Provides presets to mobile and web.

9. Document rendering service  
    Generates PDFs in contractor templates and creates share pages.

10. Signature service  
     Integrates with e signature provider and tracks envelope state.

### **Storage components**

1. PostgreSQL as the system of record

2. pgvector inside Postgres for embeddings and retrieval in MVP

3. Object storage for raw uploads, scan artifacts, images, PDFs

4. Redis for job queue, caching, rate limiting

### **Background job system**

1. Use Celery or Dramatiq with Redis broker

2. Jobs

   1. Document extraction job

   2. Schema builder job

   3. Estimate generation job

   4. PDF render job

   5. Allowance refresh job

---

## **Data model specification**

### **Core entities**

1. Organization

2. User

3. Role

4. Project

5. SiteVisit

6. RoomCapture

7. QuantitySheet

8. StylePreset

9. DesignSnapshot

10. ScopeInput

11. Estimate

12. EstimateVersion

13. EstimateSection

14. EstimateLineItem

15. PricingAuditEvent

16. DocumentTemplate

17. GeneratedDocument

18. SignatureEnvelope

19. CompanyProfile

20. CompanyEstimatingProfile

21. CompanyDocument

22. NormalizedEstimateDocument

23. AllowanceCatalog

24. AllowanceBand

### **RoomCapture and QuantitySheet versioning**

1. RoomCapture stores raw RoomPlan output and metadata

2. QuantitySheet is derived and versioned

3. EstimateVersion references a specific QuantitySheet version and StylePreset id

### **Design snapshots**

1. For each RoomCapture and StylePreset

2. Store list of snapshot assets, camera ids, and a thumbnail index

3. Store a render timestamp and a local vs uploaded flag

---

## **API specification**

### **Authentication**

1. Token based auth

2. Every request includes org context

3. Strict tenant isolation on org\_id

### **Key endpoints**

1. Company onboarding

   1. POST /orgs

   2. PATCH /orgs/{org\_id}/profile

   3. POST /orgs/{org\_id}/documents/upload-url

   4. POST /orgs/{org\_id}/documents/complete

   5. POST /orgs/{org\_id}/schema/build

   6. GET /orgs/{org\_id}/estimating-profile

   7. PATCH /orgs/{org\_id}/estimating-profile

2. Style presets

   1. GET /style-presets?room\_type=bathroom

   2. POST /style-presets

   3. PATCH /style-presets/{preset\_id}

3. Field capture

   1. POST /projects

   2. POST /projects/{project\_id}/site-visits

   3. POST /site-visits/{visit\_id}/room-captures/upload-url

   4. POST /site-visits/{visit\_id}/room-captures/complete

   5. POST /room-captures/{capture\_id}/quantity-sheets

   6. PATCH /quantity-sheets/{sheet\_id}

4. Estimate generation

   1. POST /estimates  
       Input includes capture\_id, quantity\_sheet\_id, scope\_inputs, selected\_style\_preset\_id

   2. GET /estimates/{estimate\_id}

   3. GET /estimates/{estimate\_id}/versions/{version\_id}

   4. GET /estimates/{estimate\_id}/audit

5. Allowances

   1. GET /allowances/bands?region=...\&room\_type=...\&tier=...

   2. POST /allowances/refresh

6. Documents and sharing

   1. POST /estimates/{estimate\_id}/pdf

   2. GET /documents/{doc\_id}/download-url

   3. POST /estimates/{estimate\_id}/share

   4. GET /share/{share\_token}

7. Signature

   1. POST /estimates/{estimate\_id}/signature/envelope

   2. GET /signature/envelopes/{envelope\_id}

   3. POST /signature/webhook

---

## **Rendering pipeline specification**

### **On device render, instant mode**

1. Mobile app builds a renderable scene from RoomPlan surfaces

2. App applies StylePreset materials and lighting

3. App renders fixed camera snapshots

4. App uploads snapshots to object storage

5. Backend links snapshots to the estimate and share page

### **Cloud render, optional future upgrade**

1. Backend receives a reference photo and the room skeleton

2. Cloud job generates photoreal images

3. Share page automatically upgrades images when ready

---

## **How mobile and web connect**

### **One backend, shared data**

1. Mobile app and web portal both call the same FastAPI endpoints

2. They use the same Organization, Project, Estimate, and Template objects

3. Assets live in shared object storage and are referenced by ids in Postgres

### **Seamless workflow**

1. Contractor admin sets pricing and uploads documents in the web portal

2. That configuration is immediately available on the mobile app

3. Mobile app captures scan and generates local snapshots

4. Mobile app requests estimate generation from backend

5. Web portal can view the estimate instantly, because it is the same record

6. Homeowner share link works on any device

### **Recommended identity and session model**

1. Single sign on provider for web and mobile

2. Mobile uses the same tokens

3. Share link uses a separate scoped token, not full auth

---

## **Platform architecture diagram**

`flowchart LR`  
  `subgraph Contractor`  
    `W[Web Portal\nAdmin, Documents, Pricing, Templates]`  
    `M[iOS Mobile App\nLiDAR Scan, Quantities, Instant Snapshots]`  
  `end`

  `subgraph Backend[FastAPI Platform]`  
    `API[API Gateway\nAuth, Tenancy, Rate Limits]`  
    `SCAN[Scan Service\nRoomPlan artifacts, Quantities, Versions]`  
    `DOC[Document Ingestion\nPDF parse, normalize]`  
    `SCHEMA[Company Schema Builder\nEstimating profile]`  
    `AGENT[Estimating Orchestrator\nRAG grounded drafting]`  
    `PRICE[Pricing Engine\nDeterministic totals + audit]`  
    `ALLOW[Finish Allowance Engine\nCached price bands]`  
    `PRESET[Design Presets Service\nStyles, material sets]`  
    `RENDER[Document Renderer\nPDF + share pages]`  
    `SIGN[Signature Service\nProvider integration]`  
    `QUEUE[Job Queue\nRedis + workers]`  
  `end`

  `subgraph Data[Storage]`  
    `PG[(Postgres + pgvector)]`  
    `OBJ[(Object Storage\nScans, PDFs, Images)]`  
    `REDIS[(Redis\nCache, Queue)]`  
  `end`

  `subgraph Homeowner`  
    `H[Share Page\n3 options, estimate, PDF, sign]`  
  `end`

  `W --> API`  
  `M --> API`  
  `API --> SCAN`  
  `API --> DOC`  
  `API --> SCHEMA`  
  `API --> AGENT`  
  `API --> PRICE`  
  `API --> ALLOW`  
  `API --> PRESET`  
  `API --> RENDER`  
  `API --> SIGN`

  `DOC --> QUEUE`  
  `SCHEMA --> QUEUE`  
  `AGENT --> QUEUE`  
  `RENDER --> QUEUE`  
  `ALLOW --> QUEUE`

  `API --> PG`  
  `SCAN --> OBJ`  
  `RENDER --> OBJ`  
  `DOC --> PG`  
  `SCHEMA --> PG`  
  `AGENT --> PG`  
  `PRICE --> PG`  
  `ALLOW --> PG`  
  `PRESET --> PG`

  `API --> REDIS`  
  `QUEUE --> REDIS`

  `RENDER --> H`  
  `SIGN --> H`

---

## **Performance targets for the onsite demo**

1. Scan capture: 1 to 3 minutes for a bathroom

2. Quantity sheet ready: under 10 seconds after scan

3. Instant style toggle: under 2 seconds per style switch

4. Snapshot render: under 20 seconds for 4 views per style on modern iPhone

5. Rough estimate generation: under 15 seconds server time

6. PDF generation: under 10 seconds

---

## **What to build first, in the right order**

1. Mobile scan to quantity sheet to instant snapshots for 3 styles

2. Contractor web portal for pricing rules and style preset management

3. Deterministic pricing engine and estimate versioning

4. Document ingestion and company schema builder

5. Agent draft estimate aligned to company format

6. Share link and PDF rendering

7. Signature integration

If you want, I can also provide the exact folder structure for the FastAPI modular monolith, plus a concrete Postgres schema and the iOS screen list with the required models for RoomPlan and RealityKit.

