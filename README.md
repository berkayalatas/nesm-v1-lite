# NESM V1.0 (Next.js Enterprise Settings Module)

Production-ready account settings module for modern SaaS products, built with Next.js App Router and enterprise-focused security patterns.

## Tech Stack

- Next.js 15
- Auth.js v5
- Prisma
- Tailwind CSS
- Shadcn/UI

## Features

- Secure Auth
: Credentials-based login with Auth.js session handling.
- Profile Management
: Update profile data and avatar with session refresh support.
- Security Logs (Audit)
: Server-side audit trail for profile/security/preferences actions.
- Active Sessions
: View and revoke active sessions, including logout-from-other-devices workflow.
- Optimistic UI
: Responsive form UX with immediate feedback and progressive updates.

## Setup

```bash
npm install
cp .env.example .env
npx prisma db push
npx prisma db seed
```

Create your local environment from `.env.example`, then fill in real values for your database, auth secret, and blob token.

## Environment Variables

`.env.example` includes the required keys:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL=""
AUTH_SECRET="replace-with-secret"
BLOB_READ_WRITE_TOKEN="replace-with-token"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Notes:
- `DATABASE_URL` and `AUTH_SECRET` are required.
- `BLOB_READ_WRITE_TOKEN` is required for avatar uploads with the default storage adapter.
- `DIRECT_URL` is recommended for migrations when using pooled providers.

If you are using Neon/Supabase with PgBouncer, prefer:
- `DATABASE_URL=...?...&pgbouncer=true&connection_limit=1`
- `DIRECT_URL=...` (direct, non-pooled connection string for Prisma migrations)

For intermittent connection resets (e.g. `E57P01`), first verify pooled/direct URLs above, then retry the failed Prisma operation. A simple operational pattern is 2-3 retries with short backoff for migration/seed scripts.

## First-Time Login (Seed Credentials)

After running `npx prisma db seed`, use:

- Email: `admin@example.com`
- Password: `password123`
- Permissions: `admin` (full access)

Demo account for preview/testing:

- Email: `demo@nesm.com`
- Password: `demo123`
- Permissions: `user` (limited user-level access)

Then open:

- `http://localhost:3000/signin`

## Development

```bash
npm run dev
```

## Database Migration

After setting environment variables, run:

```bash
npx prisma db push
npx prisma db seed
```

## Production Build

```bash
npm run build
npm start
```

## Deployment (Vercel)

- Add all environment variables from `.env.example` in Vercel Project Settings.
- Configure `BLOB_READ_WRITE_TOKEN` and connect Vercel Blob for avatar uploads.
- Use production `DATABASE_URL` (and `DIRECT_URL` when available) before running migrations.
