---
project_name: 'goodboyholidayhomesverce'
user_name: 'Good Boy'
date: '2026-03-21'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 47
optimized_for_llm: true
---

# Project Context for AI Agents

_Critical rules and patterns AI agents must follow when implementing code in this project. Focused on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

```
Next.js       16.0.7       App Router ONLY — no Pages Router
React         19.2.0
TypeScript    ^5           strict: true, isolatedModules: true, target: ES2017
Tailwind CSS  ^4           uses @tailwindcss/postcss plugin
Node.js       ^20

jose          ^6.1.3       JWT — HS256, NOT jsonwebtoken
nodemailer    ^7.0.11      Gmail SMTP only
framer-motion ^12.23.25
lucide-react  ^0.556.0
date-fns      ^4.1.0
react-day-picker ^9.12.0
Shadcn/ui     new-york style, RSC=true, cssVariables=true
clsx          ^2.1.1
tailwind-merge ^3.4.0
```

---

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

- **Strict mode is ON** — no implicit `any`, all function params and return types must be typed
- **`isolatedModules: true`** — every file must have at least one import/export; do NOT use `const enum`
- **Path alias** — use `@/` for all project imports (maps to project root), e.g. `import { cn } from "@/lib/utils"`
- **No barrel index files exist** — import from specific file paths, not from folder indexes
- **`esModuleInterop: true`** — use `import X from 'x'` not `import * as X from 'x'` for default exports
- **Async/await everywhere** — no raw `.then()` chains; all data functions in `lib/data.ts` are async
- **Error handling in API routes** — always wrap in try/catch, return `NextResponse.json({ error: '...' }, { status: NNN })`

### Framework-Specific Rules (Next.js 16 App Router)

**Dynamic Route Params (CRITICAL):**
- `params` in dynamic routes is a `Promise` — MUST `await params` before destructuring
  ```ts
  // ✅ CORRECT
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  }
  // ❌ WRONG — will throw in Next.js 16
  export default async function Page({ params }: { params: { id: string } }) {
    const { id } = params;
  }
  ```

**Server vs Client Components:**
- Default is Server Component — add `"use client"` only when using hooks, browser APIs, or event handlers
- `app/admin/page.tsx`, `app/dashboard/page.tsx` are Client Components (`"use client"`)
- `app/layout.tsx`, `app/properties/[id]/page.tsx`, `app/properties/page.tsx` are Server Components
- Data fetching (calls to `lib/data.ts`) happens ONLY in Server Components or API routes — never in Client Components directly

**Cookies & Headers in Server Components:**
- `await cookies()` — must be awaited (React 19 / Next.js 16 requirement)
  ```ts
  import { cookies } from 'next/headers';
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  ```

**API Routes:**
- Located at `app/api/[resource]/route.ts`
- Export named HTTP method functions: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
- Dynamic segments: `app/api/[resource]/[id]/route.ts` — same `await params` rule applies
- Always return `NextResponse.json(...)`

**Images:**
- Use `next/image` for all images
- Remote images from `images.unsplash.com` are allowed in `next.config.ts`
- Uploaded images stored in `public/uploads/` are served as `/uploads/filename`
- Do NOT add new remote hostnames without updating `next.config.ts` `remotePatterns`

**Fonts:**
- Geist Sans (`--font-geist-sans`) and Geist Mono (`--font-geist-mono`) are loaded in root layout
- Use `font-sans` / `font-mono` Tailwind classes; do NOT import fonts elsewhere

**Middleware:**
- `middleware.ts` at project root protects `/admin/:path*` and `/dashboard/:path*`
- JWT verified using `jose`'s `jwtVerify` with secret from `process.env.JWT_SECRET`
- Admin redirect to `/` if role !== `admin`; customer redirect to `/` if role !== `customer`
- Unauthenticated users redirected to `/login?callbackUrl=<encoded-url>`

### Auth & Session Rules

- JWT cookie name: `session` (httpOnly, SameSite: lax, maxAge: 86400)
- JWT algorithm: HS256; secret key: `process.env.JWT_SECRET` (fallback: `'default_secret_key_change_me'`)
- JWT payload shape: `{ id: string, email: string, role: 'admin' | 'customer', name: string }`
- Sign tokens with `new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('24h').sign(SECRET_KEY)`
- Verify tokens with `jwtVerify(token, SECRET_KEY)` from `jose`
- `secure` cookie flag is set only in production (`process.env.NODE_ENV === 'production'`)
- Roles: ONLY `'admin'` or `'customer'` — no other roles exist

### Data Layer Rules

- **Single source of truth:** `lib/data.ts` — ALL data operations go through this file
- **JSON file storage:** `data.json` at project root — read/write with `fs/promises`
- **ID generation:** `Math.random().toString(36).substr(2, 9)` — do NOT use uuid or nanoid
- **Data schema:** `{ properties: Property[], bookings: Booking[], users: User[] }`
- **Always call `ensureDataFile()`** at the start of every data function (handles first-run init)
- **No caching layer** — every call reads from disk; do NOT add in-memory caches without discussion
- **Booking status:** `'pending' | 'confirmed' | 'rejected'` — newly created bookings are always `'pending'`
- **Conflict check on confirm:** before setting status to `confirmed`, check for date overlaps on same property with other confirmed bookings
- `passwordHash` field stores plain text currently — do not rename the field even though it's not hashed

### UI & Styling Rules

- **Tailwind v4 CSS imports** — use `@import "tailwindcss"` in CSS files, NOT `@tailwind base/components/utilities`
- **`cn()` utility** — always use `cn(...inputs)` from `@/lib/utils` to merge class names (combines `clsx` + `tailwind-merge`)
- **Shadcn/ui new-york style** — all UI primitives live in `components/ui/`, do NOT modify them directly
- **CSS variables for colors** — use semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-muted`) not raw color names
- **Responsive breakpoints** — use `md:` prefix for tablet/desktop variants; mobile-first
- **Icon library** — lucide-react ONLY; icon size convention: `className="w-4 h-4"` inline, `w-5 h-5` for feature icons
- **Animations** — use `framer-motion`; `FadeIn` wrapper component available at `@/components/animations`

### File Upload Rules

- Upload endpoint: `POST /api/upload` — accepts `multipart/form-data` with field name `file` (multiple files allowed)
- Files saved to `public/uploads/` with filename pattern `${Date.now()}-${sanitized_original_name}`
- Returns `{ urls: string[] }` — relative paths like `/uploads/filename.jpg`
- Maximum 15 images per property (enforced in `PropertyForm` component, not API)
- `public/uploads/` directory is auto-created if missing — do NOT pre-create it

### Email Rules

- Transporter uses Gmail service with `goodboyholidayhomes@gmail.com` and `process.env.EMAIL_PASSWORD`
- Email errors MUST NOT fail the parent request — wrap in inner try/catch, `console.error` only
- Notification emails go TO `goodboyholidayhomes@gmail.com` (owner notifications, not customer confirmations)
- Email is optional infrastructure — if `EMAIL_PASSWORD` is not set, bookings still succeed

### Component Architecture Rules

- **Server Components** — data-fetching pages, layouts; no hooks, no event handlers
- **Client Components** — interactive pages (admin, dashboard, booking form, gallery, navbar); must have `"use client"` as first line
- **Component file naming** — kebab-case for files (`property-card.tsx`), PascalCase for component exports (`PropertyCard`)
- **Admin components** — live in `components/admin/`; plain UI components in `components/ui/`; page-level components in `components/`
- **Props typing** — always define explicit TypeScript interfaces for component props; no inline `any`
- **Import types from data layer** — reuse `Property`, `Booking`, `User` interfaces exported from `@/lib/data`

### Testing Rules

- **No test framework is configured** — there is no Jest, Vitest, Playwright, or Cypress setup
- When adding tests, do NOT assume a framework exists; set up from scratch and confirm with user first
- No `__tests__` directories or `.spec.ts` / `.test.ts` files exist currently

### Code Quality & Style Rules

- **ESLint** — `eslint-config-next` is the only rule set; run `npm run lint` to check
- **No Prettier config** — do not add Prettier formatting; match existing code style (2-space indentation, single quotes in TS)
- **No comments on obvious code** — only add comments where logic is non-obvious
- **No console.log in production paths** — use `console.error` for caught errors only
- **No TODO comments** — finish the implementation or leave it unimplemented; don't leave TODOs in code

### Development Workflow Rules

- **Deploy target:** Vercel — ensure `next build` passes before committing
- **Commit message format** — `type: description` (e.g. `feat:`, `fix:`, `refactor:`) based on git history
- **No `.env` file committed** — secrets are Vercel environment variables: `JWT_SECRET`, `EMAIL_PASSWORD`, `NODE_ENV`
- **Branch:** `main` is the primary branch and deploys to production

---

## Critical Don't-Miss Rules

**NEVER do these:**

1. **Do NOT use `params` synchronously** in App Router dynamic routes — always `await params` first (Next.js 16 breaking change)
2. **Do NOT add `"use client"` to data-fetching pages** — Server Components cannot use hooks and should stay server-side
3. **Do NOT import from `lib/data.ts` in Client Components** — this runs on the server; call `/api/` endpoints from clients instead
4. **Do NOT use `@tailwind base/components/utilities` directives** — Tailwind v4 uses `@import "tailwindcss"` in CSS
5. **Do NOT hash passwords with bcrypt yet** — the field is named `passwordHash` but stores plain text; changing this requires a data migration
6. **Do NOT add new remote image domains** without updating `next.config.ts` `remotePatterns`
7. **Do NOT throw errors from email sending** — email failures must be silent (log only); booking must succeed regardless
8. **Do NOT use `uuid` or `nanoid`** for ID generation — use `Math.random().toString(36).substr(2, 9)` to match existing data
9. **Do NOT use `cookies()` without `await`** — React 19 requires it; will throw a runtime error
10. **Do NOT create new API routes without try/catch** — all routes must handle errors and return proper status codes

**Edge Cases to Always Handle:**

- Booking date conflicts: check for overlapping confirmed bookings before confirming a new one
- Empty `customerEmail` is allowed (phone-only booking) — default to `""` not `null`
- `notFound()` from `next/navigation` for missing property IDs in dynamic routes
- Admin can be deleted (no protection yet) — be careful when deleting users
- `data.json` may not exist on first run — `ensureDataFile()` handles initialization

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code in this project
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Raise a flag if you discover a new pattern not covered here

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack or conventions change
- Review quarterly for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-03-21
