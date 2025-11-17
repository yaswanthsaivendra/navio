# Tech Stack & Rationale

## Frontend & Backend — Next.js (App Router)
- One codebase for FE + BE
- Route Handlers → backend API
- Server Components → efficient rendering
- Native support for Auth.js

---

## Database — PostgreSQL (Neon)
- Fast, scalable, cloud-native Postgres
- Free tier suitable for MVP
- Branching support for previews & testing
- Perfect with Prisma

---

## ORM — Prisma
- Best-in-class developer experience
- Strong typing
- Works perfectly with Next.js API routes
- Simple migrations

---

## Authentication — Auth.js
- Free and open-source
- Integrates cleanly with Next.js
- Prisma adapter
- Full control over:
  - roles
  - memberships
  - organizations
- Perfect for multi-tenant SaaS

---

## Browser Extension — React + Plasmo or WXT
- React for UI
- Plasmo/WXT for extension tooling
- Supports Manifest V3
- Hot reload
- Easy content script integration

---

## Storage — Cloudflare R2 or Supabase Storage
Used for:
- step thumbnails
- screenshots
- flow assets (later)

Both cheap & scalable.

---

## Deployment
- **Vercel** for Next.js app
- **Neon** for Postgres
- **Cloudflare R2** for asset storage
- **Chrome Web Store** for extension distribution

---

## Optional (Later)
- Inngest / Trigger.dev for background jobs
- PostHog for analytics
- Stripe for billing
