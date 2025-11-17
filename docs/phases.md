# Development Phases & Roadmap

This roadmap is built for fast execution, validation, and short feedback loops.

---

# Phase 1 — Browser Extension MVP (Core Value)
### Goal
Deliver core demo guidance on top of a real product.

### Build:
- Recorder (captures steps)
- Overlay runtime with:
  - step navigation
  - selector highlighting
  - tooltip overlays
  - presenter notes
- Local storage for saving flows
- Manual JSON export/import

### Outcome
A functioning prototype founders can test without a backend.

---

# Phase 2 — Web App + Multi-Tenant SaaS Foundation
### Build:
- Next.js app
- Auth.js (email/password or Google)
- Organizations (create, switch)
- Memberships (OWNER, ADMIN, MEMBER)
- Flow CRUD (create, update, delete)
- Flow list + tagging
- Extension integration:
  - Fetch flows from API
  - Sync updates

### Outcome
Your first "real" SaaS product. Ready for early adopters and pilots.

---

# Phase 3 — Branching, Rehearsal Mode & Versioning
### Build:
- Branching paths (goto step)
- Tree editor for branching demo flows
- Rehearsal/practice mode for reps
- Flow versioning & publishing

### Outcome
Teams can create professional demo playbooks.

---

# Phase 4 — Demo Data Layer (Lite Version)
### Build:
- DOM text/number overrides (visual)
- Mapping selectors → values
- (Optional) API response patching via fetch interception

### Outcome
A “Saleo-lite” feature that fixes ugly demo data without heavy engineering.

---

# Phase 5 — AI Layer
### Build:
- AI rewrite for steps/notes
- Persona-specific demo variations
- Generate flow summaries
- Generate example flows automatically

### Outcome
Less friction in creating + maintaining demo flows.

---

# Phase 6 — Analytics + Admin + Billing
### Build:
- Flow usage analytics
- Rep performance insights
- Demo session logs
- Stripe billing for Starter/Team/Scale plans

### Outcome
Full SaaS maturity. Ready for growth.
