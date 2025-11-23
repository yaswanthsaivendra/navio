# Navio

A modern multi-tenant SaaS application built with Next.js, featuring organization management, team collaboration, and role-based access control.

## Features

- 🏢 **Multi-Tenant Architecture** - Row-based multi-tenancy with organization isolation
- 👥 **Team Management** - Invite members, manage roles (Owner/Admin/Member)
- 🔐 **Authentication** - Google OAuth via NextAuth
- 📧 **Email Invitations** - Team invitation emails via Resend
- 🎨 **Modern UI** - Built with shadcn/ui and Tailwind CSS
- 🗄️ **Database** - PostgreSQL with Prisma ORM

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL + Prisma
- **Authentication:** NextAuth v5
- **Email:** Resend + React Email
- **UI:** shadcn/ui + Tailwind CSS
- **Language:** TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Google OAuth credentials
- Resend account (for email invitations)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd navio
pnpm install
```

### 2. Environment Setup

Create a `.env.local` file:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/navio"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Resend (Email Service)
RESEND_API_KEY="re_your_resend_api_key"

# App URL (for email links)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### 4. Run Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Email Setup (Resend)

### Development/Testing

By default, emails are sent to `delivered@resend.dev` (visible in your Resend dashboard) to bypass domain verification requirements.

1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Add to `.env.local`:
   ```bash
   RESEND_API_KEY="re_your_api_key"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

### Production Setup

To send emails to real recipients:

1. **Verify Your Domain** at [resend.com/domains](https://resend.com/domains)
   - Add your domain (e.g., `yourdomain.com`)
   - Configure DNS records (SPF, DKIM, DMARC)
   - Wait for verification

2. **Update Environment Variables:**

   ```bash
   RESEND_DOMAIN_VERIFIED=true
   NEXT_PUBLIC_APP_URL="https://yourdomain.com"
   ```

3. **Update Email From Address** in `lib/email.ts`:
   ```typescript
   from: "Navio <noreply@yourdomain.com>";
   ```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
6. Add authorized JavaScript origins:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

## Project Structure

```
navio/
├── app/                      # Next.js app directory
│   ├── api/auth/            # NextAuth API routes
│   ├── dashboard/           # Dashboard pages
│   │   ├── team/           # Team management
│   │   └── settings/       # Organization settings
│   ├── onboarding/         # User onboarding flow
│   └── login/              # Login page
├── components/              # React components
│   ├── ui/                 # shadcn/ui components
│   └── app-sidebar.tsx     # Main sidebar
├── emails/                  # Email templates
│   └── invitation-email.tsx
├── lib/
│   ├── actions/            # Server actions
│   │   ├── tenant.ts       # Organization CRUD
│   │   ├── membership.ts   # Team member management
│   │   └── invitation.ts   # Invitation management
│   ├── email.ts            # Email service
│   ├── auth.ts             # NextAuth configuration
│   └── db.ts               # Prisma client
└── prisma/
    └── schema.prisma       # Database schema
```

## Key Features

### Multi-Tenancy

- Row-based multi-tenancy using `tenantId` foreign keys
- Organization switcher in sidebar
- Cookie-based active tenant selection
- Automatic tenant isolation in queries

### Role-Based Access Control

Three roles with different permissions:

- **Owner** - Full control (delete org, manage all members)
- **Admin** - Manage members, send invitations
- **Member** - Read-only access

### Team Invitations

- Send email invitations to team members
- Set role (Member/Admin) for invitees
- 7-day expiration on invitations
- Resend and cancel functionality
- Automatic membership creation on acceptance

## Development

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Preview Email Templates

```bash
npx react-email dev
```

Visit [http://localhost:3000](http://localhost:3000) to preview emails.

### Build for Production

```bash
pnpm build
pnpm start
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

```bash
DATABASE_URL="your-production-db-url"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-production-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
RESEND_API_KEY="your-resend-api-key"
RESEND_DOMAIN_VERIFIED=true
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
