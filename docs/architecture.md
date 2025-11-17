# Architecture

## 1. High-Level Overview

The system has two main parts:

1. **Web App (Multi-tenant SaaS)** – built with Next.js, serving both frontend and backend APIs:
   - Tenant (organization) management.
   - User accounts and auth.
   - Flow + step storage and editing.
   - Analytics and configuration.

2. **Browser Extension (Runtime + Recorder)**:
   - Injects overlays and presenter panel on top of any web app (the customer’s product).
   - Records flows (steps) with selectors and metadata.
   - Plays back flows during live demos.

Data is stored in a **PostgreSQL database** (Neon/Supabase/Railway), accessed via **Prisma**, with strict multi-tenant boundaries.

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
    - Extension sync (fetch/update flows).
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
  - `FlowStep` (belongs to a flow; stores selector, URL, overlay content, etc.)
  - (Later) `DemoProfile`, `AnalyticsEvent`, `DemoDataOverride`
- **Multi-tenancy**:
  - Every business object (`Flow`, `FlowStep`, etc.) includes `orgId`.
  - All queries in APIs are filtered by `orgId`.
  - Membership table ensures only authorized users can access an org’s data.

---

## 3. Browser Extension Architecture

The extension is split into three key parts:

1. **Content Script – Recorder**
   - Injected into the target web app (customer’s product).
   - Listens to click/interaction events.
   - Captures:
     - URL
     - DOM selector for the clicked element
     - Optional screenshot thumbnail (later)
   - Builds a **flow draft** and sends it to the backend via the extension background script.

2. **Content Script – Runtime (Overlay Player)**
   - When a rep starts a flow:
     - Fetches the steps from the backend (via background script).
     - Renders overlay UI:
       - Highlight around selected element (using stored selector).
       - Tooltip with step title + description.
       - Presenter panel with full list of steps + private notes.
     - Handles **next/previous step** navigation and simple branching.
   - Manages URL checks:
     - If the step is tied to a specific URL pattern, it waits until the rep navigates there, then activates the highlight.

3. **Background / Service Worker**
   - Manages:
     - Extension-level authentication (uses a token issued by the web app).
     - Sync between content script and web app APIs.
   - Handles all network calls:
     - `GET /api/extension/flows` – list flows for current org/user.
     - `GET /api/extension/flows/:id` – fetch single flow.
     - `POST /api/extension/flows/:id/steps` – upload recorded steps.

4. **Extension UI (Popup / Options Page)**
   - Simple UI to:
     - Sign in / link to the web app.
     - Choose current organization (if user belongs to multiple).
     - Start/stop recording a new flow.
     - Quickly start a flow on the current page.

---

## 4. Data Flow Scenarios

### 4.1 Recording a Flow

1. User clicks “Start Recording” in extension popup (or web app triggers it).
2. Background script tells content script to begin recording.
3. Content script:
   - Tracks each click:
     - DOM selector
     - URL
     - Optional metadata (e.g., innerText, type of element).
   - Builds a list of steps in memory.
4. When user clicks “Stop Recording”:
   - Content script sends steps to background script.
   - Background script sends them to:
     - `POST /api/flows` (creates Flow)
     - `POST /api/flows/:id/steps` (bulk create FlowSteps)
5. Web app persists flow and steps in Postgres.
6. User can now open the web app to edit titles, descriptions, notes, and branching.

### 4.2 Playing a Flow (Demo)

1. From the extension popup or web app, the user selects a flow to run.
2. Extension background script fetches steps from `GET /api/flows/:id`.
3. Content script:
   - Initializes overlay UI and presenter panel.
   - For each step:
     - Ensures the current URL matches (or partially matches) the stored URL.
     - Uses the selector to locate the DOM element.
     - Draws a highlight + tooltip next to the element.
     - Shows the corresponding step + notes in the presenter panel.
4. Rep clicks “Next” or uses keyboard shortcuts to move through the flow.

---

## 5. Demo Data Override (Future Phase)

Not MVP, but architectural consideration:

- Introduce `DemoDataOverride` model:
  - `orgId`, `flowId` (optional), `selector` or `variableKey`, `value`.
- Extension runtime:
  - For matched elements or JS variables, overrides:
    - Text content of nodes.
    - Certain chart config values (e.g., numbers fed into chart libraries).
  - Two approaches:
    - **DOM patching**: direct innerText/attribute changes.
    - **Lightweight interception**: override JS/global variables used by the UI (harder and library-specific, so this is a later phase).

---

## 6. Multi-Tenancy & Auth Enforcement

- **Auth**:
  - Web app uses session-based auth (Auth.js).
  - Extension uses **short-lived JWT** or API key generated per user.
- **Org Selection**:
  - User can belong to multiple orgs via membership.
  - Active org is selected in the web app and/or extension settings.
- **API Enforcement**:
  - Every request includes:
    - `userId` from auth.
    - `orgId` (from active membership).
  - Backend checks membership before reading/writing flows.
- This architecture keeps the extension “dumb” regarding security and lets the backend do all critical checks.

---

## 7. Deployment Diagram (Textual)

- **Browser (Customer’s SaaS app)**:
  - ↓ Content Script / Overlay
  - ↔ Background Script (extension)
  - ↔ HTTPS calls to **Next.js API** (Vercel)
- **Next.js API**:
  - ↔ PostgreSQL (Neon/Supabase/Railway)
  - (Later) ↔ Object Storage (R2/Supabase) for screenshots

This gives you one shared codebase (Next.js) for:
- Frontend (dashboard)
- Backend APIs (route handlers)
- Auth + org handling
- Prisma access to DB