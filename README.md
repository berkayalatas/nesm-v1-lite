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

## Installation

```bash
npm install
npx prisma db push
npx prisma db seed
```

## Environment Variables

Create `.env` with the following keys:

```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="replace-with-secret"
AUTH_SECRET="replace-with-secret"
BLOB_READ_WRITE_TOKEN="replace-with-token"
```

Notes:
- `DATABASE_URL` and `AUTH_SECRET` are required.
- `BETTER_AUTH_SECRET` is kept for compatibility with existing project configuration.
- `BLOB_READ_WRITE_TOKEN` is required when using the default avatar upload adapter.

## First-Time Login (Seed Credentials)

After running `npx prisma db seed`, use:

- Email: `admin@example.com`
- Password: `password123`

Then open:

- `http://localhost:3000/signin`

## Development

```bash
npm run dev
```

## Production Build

```bash
npm run build
npm start
```
