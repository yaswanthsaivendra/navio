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

## Browser Extension — React + Vite
- React for UI components
- Vite for build tooling and development
- Supports Manifest V3
- Hot reload during development
- **Purpose**: Screenshot capture during workflow recording
- **NOT for overlay injection** – purely for recording and screenshot capture
- Content script for interaction tracking
- Background script (service worker) for screenshot uploads and API sync

---

## Storage — Cloudflare R2
Used for:
- screenshots
- flow assets

**Why Cloudflare R2:**
- **Best free tier:** 10GB storage, 1M writes, 10M reads/month
- **No egress fees:** Critical for long-term cost savings
- **S3-compatible API:** Standard, easy to integrate
- **Simple setup:** Works with AWS SDK (`@aws-sdk/client-s3`)
- **Long-term viable:** $0.015/GB storage, predictable pricing
- **CDN integration:** Fast global delivery
- **Recommended by Neon:** [Official Neon guide](https://neon.com/docs/guides/file-storage) recommends R2

---

## Deployment
- **Vercel** for Next.js app
- **Neon** for Postgres (database)
- **Cloudflare R2** for screenshot storage
- **Chrome Web Store** for extension distribution

---

## Optional (Later)
- Inngest / Trigger.dev for background jobs
- PostHog for analytics
- Stripe for billing
