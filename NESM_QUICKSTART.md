# NESM Settings Module Quickstart

This guide is for teams integrating the NESM Settings module into a fresh Next.js app in under 60 minutes.

## **Core Features**

- **Profile Management:** avatar upload, name/email updates, strict validation.
- **Security Controls:** password change, session revoke, logout-other-devices.
- **Preferences UX:** optimistic autosave toggles with rollback on failure.
- **Activity Audit Log:** server-side pagination, URL-based filtering, metadata rendering.
- **Onboarding DX:** `nesm:check`, welcome dashboard, dismissible success banner.

## 1. Prerequisites

- Next.js App Router project (`next@16+`, `react@19+`)
- PostgreSQL database
- Prisma configured in the host app
- Auth.js / NextAuth v5 route support

## 2. Install Dependencies

Install the required runtime packages (if your host app does not already have them):

```bash
npm install @auth/prisma-adapter @prisma/client bcrypt next-auth zod @hookform/resolvers react-hook-form sonner lucide-react @vercel/blob
```

Install dev dependencies:

```bash
npm install -D prisma tsx @playwright/test
```

After dependencies are installed, run the environment validator:

```bash
npm run nesm:check
```

## 3. shadcn/ui Setup

Initialize shadcn/ui if needed:

```bash
npx shadcn@latest init
```

Add the components used by this module:

```bash
npx shadcn@latest add alert-dialog avatar badge button card dialog form input label pagination select separator skeleton switch table toast
```

## 4. Copy Module Files

Copy `src/features/settings` into your target project.

Also ensure these files exist in your project:

- `src/components/ui/*` primitives used by the module
- `src/lib/utils.ts` (for `cn`)
- `src/app/(dashboard)/settings/*` routes
- `src/app/api/auth/[...nextauth]/route.ts`

## 5. Prisma Setup

Merge the NESM models into your `prisma/schema.prisma`:

- `UserPreferences`
- `AuditLog`
- required `User` relations (`preferences`, `auditLogs`)

Then run:

```bash
npx prisma migrate dev
npx prisma generate
```

Optional seed:

```bash
npx prisma db seed
```

## 6. Environment Variables

Create `.env` from `.env.example` and set:

- `DATABASE_URL`: Postgres connection string
- `AUTH_SECRET`: auth/session encryption secret
- `BLOB_READ_WRITE_TOKEN`: required only for default avatar upload adapter
- `E2E_EMAIL`, `E2E_PASSWORD`: optional, only for Playwright smoke tests

## 7. Architecture Overview

The module uses adapter-oriented architecture to stay portable:

- `SecurityAuthAdapter` (`src/features/settings/lib/auth-adapter.ts`)
  - Encapsulates password hashing/verification and session revocation.
  - Lets integrators swap auth/session internals without rewriting UI/actions.
- `AvatarStorageAdapter` (`src/features/settings/lib/storage.ts`)
  - Decouples file upload provider from feature logic.
  - Replace Vercel Blob with S3/R2/local storage by swapping one adapter.

This keeps business logic stable while provider-specific code remains isolated.

## 8. Fresh Install Checklist

- Route constants are centralized in `src/features/settings/lib/routes.ts`.
- Activity action/filter configuration is centralized in `src/features/settings/types/activity.ts`.
- Revalidation and navigation paths resolve from constants (no scattered route literals).
- Sign-out uses `signOut({ callbackUrl })` from the sidebar and redirects to home route.

## 9. Verify Integration

Run:

```bash
npm run lint
npx tsc --noEmit
npm run dev
```

Optional smoke tests:

```bash
npx playwright install
npm run test:e2e
```

## 10. Support

If integration fails, collect and share:

- Prisma migration output
- server logs for `/api/auth/[...nextauth]`
- browser console errors from `/settings/*`
- current `schema.prisma` and `.env` variable names

For module extension, start with:

- `src/features/settings/types/activity.ts` for new activity action families
- `src/features/settings/lib/routes.ts` for route remapping
- adapter files in `src/features/settings/lib/*-adapter.ts` for provider swaps

## 11. Troubleshooting

- `nesm:check` shows `Database connection failed`:
  - Confirm `DATABASE_URL` is valid and points to the correct host/port.
  - For Neon/Postgres providers, ensure network/IP access rules allow your current machine.
  - Verify SSL requirements from your provider are reflected in the connection string.
- `AUTH_SECRET is missing` warning:
  - Add a strong random `AUTH_SECRET` in `.env` before testing sign-in/session flows.
- `BLOB_READ_WRITE_TOKEN is missing` warning:
  - Safe to ignore for local dev if avatar uploads are not required.
  - Add token before enabling production avatar upload via Vercel Blob.
