# Features

> **Last Updated:** January 2025  
> This document tracks the current implementation and future enhancements for features in Navio.

## Table of Contents

- [Sharing & Analytics](#sharing--analytics)
  - [Current Implementation](#current-implementation)
  - [Future Enhancements](#future-enhancements)
- [More Features Coming Soon...](#more-features-coming-soon)

---

## Sharing & Analytics


## Current Implementation

### Sharing Features

#### ✅ Auto-Generated Share Links
- **Status:** Implemented
- Share links are automatically generated when a flow is created
- One share link per flow (regenerate to revoke old link)
- Cryptographically secure tokens using `crypto.randomBytes()`

#### ✅ Share Management
- **Status:** Implemented
- Share dialog in flow detail page (`ShareFlowDialog`)
- Copy link to clipboard
- Regenerate link (creates new token, revokes old one)
- Revoke link (deletes share)

#### ✅ Public Share Page
- **Status:** Implemented
- Public URL: `/s/[token]`
- No authentication required
- Browser mockup with navigation controls
- Keyboard navigation (Arrow keys, Home, End)
- Smooth image transitions with preloading
- Analytics tracking (VIEW, FLOW_COMPLETE events)

#### ✅ Image Access for Shared Flows
- **Status:** Implemented
- Public image proxy endpoint (`/api/images/[...path]`)
- Automatically allows public access for images from shared flows
- Extracts `flowId` from image path and checks for active share

**Files:**
- `lib/actions/flow-share.ts` - Share link management
- `app/api/flows/[id]/share/route.ts` - Share API endpoints
- `app/s/[token]/page.tsx` - Public share page
- `app/s/[token]/public-flow-viewer.tsx` - Public viewer component
- `app/dashboard/flows/components/share-flow-dialog.tsx` - Share dialog
- `app/api/images/[...path]/route.ts` - Image proxy with public access

---

### Analytics Features

#### ✅ Event Tracking
- **Status:** Implemented
- Event types: `VIEW`, `FLOW_COMPLETE`
- Client-side tracking from public share pages
- Session-based tracking (sessionStorage)
- Rate limiting (100 requests/minute per IP)
- Privacy-conscious (hashed IP addresses)

#### ✅ Flow Analytics
- **Status:** Implemented
- Total views per flow
- Completion rate (unique viewers who completed)
- Unique viewers count
- API endpoint: `GET /api/analytics/flows/[id]`

#### ✅ Overall Analytics Dashboard
- **Status:** Implemented
- Dashboard page: `/dashboard/analytics`
- Summary metrics:
  - Total flows
  - Total shares
  - Total views
  - Total completions
  - Average completion rate
  - Top flows by views
- API endpoint: `GET /api/analytics/overview`

**Files:**
- `lib/actions/analytics.ts` - Analytics server actions
- `app/api/public/analytics/event/route.ts` - Public event tracking
- `app/api/analytics/flows/[id]/route.ts` - Flow analytics API
- `app/api/analytics/overview/route.ts` - Overall analytics API
- `app/dashboard/analytics/page.tsx` - Analytics dashboard
- `app/dashboard/analytics/analytics-client.tsx` - Dashboard client component

---

## Database Schema

### FlowShare Model
```prisma
model FlowShare {
  id          String   @id @default(cuid())
  flowId      String   @unique
  flow        Flow     @relation(fields: [flowId], references: [id], onDelete: Cascade)
  shareToken  String   @unique
  createdBy   String
  creator     User     @relation("ShareCreator", fields: [createdBy], references: [id])
  viewCount   Int      @default(0)
  analyticsEvents AnalyticsEvent[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### AnalyticsEvent Model
```prisma
enum AnalyticsEventType {
  VIEW
  FLOW_COMPLETE
}

model AnalyticsEvent {
  id          String   @id @default(cuid())
  flowId      String
  flow        Flow     @relation(fields: [flowId], references: [id], onDelete: Cascade)
  shareId     String?
  share       FlowShare? @relation(fields: [shareId], references: [id], onDelete: SetNull)
  eventType   AnalyticsEventType
  sessionId   String
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## Future Enhancements

### Sharing Enhancements

#### 🔲 Password Protection
- Add password requirement for share links
- Optional password field in share dialog
- Password verification on public share page

#### 🔲 Expiration Dates
- Set expiration date/time for share links
- Automatic revocation after expiration
- UI to set expiration in share dialog

#### 🔲 Multiple Share Links
- Support multiple share links per flow
- Different links for different campaigns/audiences
- Track analytics per share link

#### 🔲 Email Sharing
- Send share link via email
- Email templates
- Track email opens/clicks

#### 🔲 QR Codes
- Generate QR code for share link
- Download QR code image
- Display QR code in share dialog

#### 🔲 Embed Codes
- Generate embed code for iframe
- Customizable embed dimensions
- Embed preview in share dialog

#### 🔲 Social Media Sharing
- Share to Twitter, LinkedIn, Facebook
- Custom share messages
- Open Graph meta tags for better previews

#### 🔲 Custom Slugs
- Allow custom URL slugs instead of tokens
- Branded share links
- Slug validation and uniqueness checks

#### 🔲 Share Link Analytics
- Analytics specific to each share link
- Track which share link generated views
- Compare performance across share links

---

### Analytics Enhancements

#### 🔲 Charts & Graphs
- Visual charts for views over time
- Completion rate trends
- Step-by-step view distribution
- Interactive date range selection

#### 🔲 Step-by-Step Analytics
- Track individual step views
- Drop-off points analysis
- Time spent per step
- Most viewed steps

#### 🔲 Advanced Metrics
- Average time to complete
- Bounce rate (single step views)
- Return viewer tracking
- Engagement score

#### 🔲 Referrer Tracking
- Track where viewers came from
- UTM parameter support
- Source/medium/campaign breakdown
- Referrer domain analysis

#### 🔲 Geographic Data
- Country/region breakdown
- City-level data (if available)
- Map visualization
- Geographic performance insights

#### 🔲 Device & Browser Analytics
- Device type (desktop, mobile, tablet)
- Browser breakdown
- OS distribution
- Screen resolution data

#### 🔲 Export Functionality
- Export analytics as CSV
- PDF reports
- Scheduled email reports
- Custom date ranges

#### 🔲 Analytics Aggregation
- Pre-aggregated analytics table
- Faster dashboard load times
- Time-based aggregations (hourly, daily, weekly)
- Materialized views for performance

#### 🔲 Real-Time Analytics
- Live view count updates
- WebSocket connections for real-time data
- Live activity feed
- Real-time completion tracking

#### 🔲 Team Analytics
- Share analytics with team members
- Role-based access control
- Team-wide analytics dashboard
- Collaboration insights

#### 🔲 Custom Events
- Track custom events (button clicks, form submissions)
- User-defined event tracking
- Event funnels
- Conversion tracking

---

## Technical Notes

### Current Architecture

**Share Link Generation:**
- Auto-generated on flow creation (in transaction)
- Lazy generation for existing flows (on first share dialog open)
- Token format: `share_{base64url}` (32 random bytes)

**Analytics Tracking:**
- Client-side event tracking from public pages
- Server-side aggregation queries
- Session-based deduplication
- Rate limiting to prevent abuse

**Image Access:**
- Proxy endpoint checks if flow has active share
- Public access granted automatically for shared flows
- Extracts `flowId` from image path: `screenshots/{flowId}/...`

### Performance Considerations

**Current:**
- On-the-fly analytics queries (fast enough for MVP)
- No caching (can add if needed)
- Simple aggregations using SQL

**Future Optimizations:**
- Pre-aggregated analytics tables
- Redis caching for frequently accessed data
- Background job processing for heavy aggregations
- CDN caching for public share pages

### Privacy & Security

**Current:**
- IP addresses hashed before storage
- No cookies required
- Session-based tracking (sessionStorage)
- Rate limiting on public endpoints

**Future Enhancements:**
- GDPR compliance features
- Data retention policies
- User data export/deletion
- Cookie consent (if needed for future features)

---

## Implementation History

### January 2025
- ✅ Auto-generated share links
- ✅ Public share page with browser mockup
- ✅ Basic analytics (views, completions)
- ✅ Analytics dashboard
- ✅ Image preloading and smooth transitions
- ✅ Keyboard navigation on share page

---

## More Features Coming Soon...

This document will be expanded as new features are added to Navio. Each feature section will follow the same structure:
- Current Implementation
- Future Enhancements
- Technical Notes

---

---

## More Features Coming Soon...

This document will be expanded as new features are added to Navio. Each feature section will follow the same structure:
- Current Implementation
- Future Enhancements
- Technical Notes

---

## Notes

- This document should be updated as features are added or modified
- Future enhancements are prioritized based on user feedback and business needs
- All implementations follow industry best practices and security standards

