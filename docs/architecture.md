# Architecture

## 1. High-Level Overview

The system has two main parts:

1. **Web App (Multi-tenant SaaS)** – built with Next.js, serving both frontend and backend APIs:
   - Tenant (organization) management.
   - User accounts and auth.
   - Flow + step storage and editing.
   - Screenshot-based demo playback.
   - Analytics and configuration.

2. **Browser Extension (Screenshot Recorder)**:
   - Records user interactions (clicks, scrolls, navigation) on any website.
   - Captures screenshots at each step of the workflow.
   - Uploads screenshots and step metadata to the web app.
   - No overlay injection – purely for screenshot capture.

Data is stored in a **PostgreSQL database** (Neon/Supabase/Railway), accessed via **Prisma**, with strict multi-tenant boundaries. Screenshots are stored in **Object Storage** (R2/Supabase).

---

## 2. Components

### 2.1 Web App (Next.js)

- **Framework**: Next.js (App Router).
- **Responsibilities**:
  - Serve the dashboard UI for admins and reps.
  - Provide authenticated REST/JSON endpoints for:
    - Auth & user profile.
    - Organizations and membership.
    - Flows and steps CRUD.
    - Flow and step management.
  - Enforce **organization-scoped access** (multi-tenancy).
- **Deployment**:
  - Deployed on Vercel (or similar free-tier friendly provider).
  - Environment variables for DB, auth secrets, etc.

### 2.2 Database Layer

- **Database**: PostgreSQL (Neon/Supabase/Railway free tier).
- **ORM**: Prisma.
- **Core tables/models** (simplified):
  - `User`
  - `Organization`
  - `Membership` (User ↔ Organization with role)
  - `Flow` (belongs to an organization, created by a user)
   - `FlowStep` (belongs to a flow; stores screenshot, URL, step content, etc.)
  - (Later) `DemoProfile`, `AnalyticsEvent`, `DemoDataOverride`
- **Multi-tenancy**:
  - Every business object (`Flow`, `FlowStep`, etc.) includes `orgId`.
  - All queries in APIs are filtered by `orgId`.
  - Membership table ensures only authorized users can access an org’s data.

---

## 3. Browser Extension Architecture

The extension is focused on **screenshot capture**, not overlay injection:

1. **Content Script – Recorder**
   - Injected into the target web app (customer's product).
   - Listens to click/interaction events and navigation.
   - Captures:
     - Screenshot of the current page state
     - URL
     - Click coordinates (for hotspot annotations)
     - Optional metadata (element text, type)
   - Builds a **flow draft** with screenshots and sends to background script.

2. **Background / Service Worker**
   - Manages:
     - Extension-level authentication (uses a token issued by the web app).
     - Uploading screenshots to object storage.
     - Syncing flow data with web app APIs.
   - Handles all network calls:
     - `POST /api/extension/flows` – create flow from recording
     - `POST /api/extension/flows/:id/steps` – upload recorded steps with screenshots
     - `GET /api/extension/flows` – list flows for current org/user

3. **Extension UI (Popup)**
   - Simple UI to:
     - Sign in / link to the web app.
     - Choose current organization (if user belongs to multiple).
     - Start/stop recording a new flow.
     - View recording progress.

---

## 4. Data Flow Scenarios

### 4.1 Recording a Flow (Screenshot-Based)

1. User clicks "Start Recording" in extension popup.
2. Background script tells content script to begin recording.
3. Content script:
   - Tracks each click/navigation:
     - Captures screenshot of current page state
     - URL
     - Click coordinates
     - Optional metadata (element text, type)
   - Builds a list of steps with screenshots in memory.
4. When user clicks "Stop Recording":
   - Content script sends steps (with screenshots) to background script.
   - Background script:
     - Uploads screenshots to object storage (R2/Supabase)
     - Sends flow metadata to:
       - `POST /api/flows` (creates Flow)
       - `POST /api/flows/:id/steps` (bulk create FlowSteps with screenshot URLs)
5. Web app persists flow and steps in Postgres (with screenshot URLs).
6. User can now open the web app to edit titles, descriptions, notes, add annotations/hotspots, and reorder steps.

### 4.2 Playing a Flow (Screenshot-Based Demo)

1. User opens a flow in the web app.
2. Web app fetches flow and steps from database.
3. Web app displays screenshots in sequence:
   - Shows screenshot for current step
   - Displays step title, description, and notes
   - Shows annotations/hotspots if configured
   - Navigation controls (Next/Previous)
4. User navigates through steps to view the complete demo flow.
5. Demo is self-contained – no live product interaction needed.

---

## 5. Multi-Tenancy & Auth Enforcement

- **Auth**:
  - Web app uses session-based auth (Auth.js).
- **Org Selection**:
  - User can belong to multiple orgs via membership.
  - Active org is selected in the web app and extension popup.
- **API Enforcement**:
  - Every request includes:
    - `userId` from auth.
    - `orgId` (from active membership).
  - Backend checks membership before reading/writing flows.
- The backend enforces all security checks and multi-tenant boundaries.

---

## 6. Deployment Diagram (Textual)

- **Browser Extension**:
  - Content Script (recording) → Background Script
  - Background Script ↔ HTTPS calls to **Next.js API** (Vercel)
  - Background Script ↔ Object Storage (R2/Supabase) for screenshot uploads
- **Next.js API**:
  - ↔ PostgreSQL (Neon/Supabase/Railway)
  - ↔ Object Storage (R2/Supabase) for screenshots

This gives you one shared codebase (Next.js) for:
- Frontend (dashboard)
- Backend APIs (route handlers)
- Auth + org handling
- Prisma access to DB