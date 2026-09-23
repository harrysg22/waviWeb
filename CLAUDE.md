# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm run dev        # Start dev server
pnpm run build      # Production build (outputs to dist/)
```

No test suite is configured. TypeScript is present but there is no `tsc` script and no `tsconfig.json` — type errors surface only at build time via Vite.

## Environment variables

Required in `.env.local`:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase publishable key
- `VITE_GOOGLE_MAPS_KEY` — Google Maps Places API key (used in RegisterWizard for address autocomplete)

Only `VITE_`-prefixed vars are exposed to the browser by Vite.

## Architecture

This is a React + Vite + TypeScript marketing/landing page for the Wavi mobile app, deployed on Cloudflare Pages.

**Entry point**: `src/main.tsx` → `src/app/App.tsx` → React Router → pages

**Routes** (`src/app/routes.tsx`):
- `/` — `Home` (main landing page)
- `/terminos-y-condiciones` — Terms and Conditions
- `/politica-de-privacidad` — Privacy Policy
- `/descargar` — Download page
- `/register` — `RegisterWizard` (multi-step business onboarding form)
- `/register/done` — `RegisterSuccess` (post-submission confirmation)
- `/portal` — `BusinessPortal` (protected via `ProtectedBusinessRoute`; self-service dashboard for approved businesses)
- `/portal/info` — `PortalInfo` (protected; edit business profile, hours, contact info)
- `/portal/services` — `PortalServices` (protected; manage services)
- `/portal/promos` — `PortalPromos` (protected; manage promotions)
- `/portal/events` — `PortalEvents` (protected; manage events)
- `/admin` — `AdminDashboard` (protected via `ProtectedAdminRoute`; lists business registrations by status)
- `/admin/:id` — `RegistrationDetail` (protected; review and approve/reject a single registration)
- `/admin/edits/:id` — `EditRequestDetail` (protected; review and approve/reject a single business edit request — see "Business Portal" below)

**Home page** (`src/app/pages/marketing/Home.tsx`) is a single scrollable page composed of ordered section components: `Navbar → HeroSection → AboutUsSection → DownloadAppSection → ExperiencesSection → BenefitsSection → BusinessSection → TestimonialsSection → FinalCTASection → Footer`. Hash-based scroll navigation is handled via `useLocation`.

**Component layers** (`src/app/components/`), grouped by feature:
- `marketing/` — landing-page section components (`Navbar`, `HeroSection`, `Footer`, etc.)
- `portal/` — shared UI for the business portal (`PortalHeader`)
- `auth/` — route guards (`ProtectedAdminRoute`, `ProtectedBusinessRoute`)
- `ui/` — generic shadcn/ui-style primitives (Radix UI + Tailwind wrappers)
- `figma/` — Figma-originated helpers (e.g. `ImageWithFallback`)

**Page layers** (`src/app/pages/`), grouped the same way: `marketing/` (Home, DownloadPage, PrivacyPolicy, TermsAndConditions), `registration/` (RegisterWizard, RegisterSuccess), `portal/` (BusinessPortal, PortalInfo, PortalServices, PortalPromos, PortalEvents), `admin/` (AdminDashboard, RegistrationDetail, EditRequestDetail).

**Export convention**: `components/` use named exports, `pages/` use default exports.

**Animations**: The `motion` package (same API as Framer Motion) is used across section components. Always import as `from 'motion/react'`, not `from 'framer-motion'`.

**Toast notifications**: Use `sonner` via `src/app/components/ui/sonner.tsx`.

## Directory map

```
CLAUDE.md                    - agent/collaborator guidance for this repo (this file)
README.md                    - generic project readme (install/run instructions)
ATTRIBUTIONS.md              - shadcn/Unsplash license attribution
index.html                   - Vite entry point
public/                      - static assets served as-is (favicon, _redirects, etc.)
src/
  main.tsx, vite-env.d.ts    - app bootstrap
  app/
    App.tsx, routes.tsx      - React Router setup, all route definitions
    components/
      marketing/             - landing-page section components (Navbar, HeroSection, Footer, ...)
      portal/                - shared UI for the business self-service portal (PortalHeader)
      auth/                  - route guards (ProtectedAdminRoute, ProtectedBusinessRoute)
      ui/                    - generic shadcn/ui primitives (Radix + Tailwind wrappers)
      figma/                 - Figma-originated helpers (ImageWithFallback)
    pages/
      marketing/             - Home, DownloadPage, PrivacyPolicy, TermsAndConditions
      registration/          - RegisterWizard, RegisterSuccess (business onboarding)
      portal/                - BusinessPortal + PortalInfo/Services/Promos/Events
      admin/                 - AdminDashboard, RegistrationDetail, EditRequestDetail
  lib/                       - supabase.ts (client), useBusinessSite.ts (portal hook)
  styles/                    - Tailwind v4 theme, fonts, globals
supabase/
  migrations/                - schema history, see "Migrations" section below
  functions/                 - Edge Functions (approve-registration, approve-edit-request)
```

## Supabase backend

`src/lib/supabase.ts` exports a single `supabase` client used across all pages.

**Admin auth**: `ProtectedAdminRoute` calls `supabase.auth.getSession()` and then queries the `account` table for `tipo === 'admin'`. Non-admin sessions are redirected to `/`.

**Business registration flow**:
1. User authenticates via OAuth (Google/Apple) on `/register`
2. `RegisterWizard` collects business info across **7 required steps** (Tu negocio, Ubicación, Horarios, Contacto, Imágenes, Logo, Servicios extra) plus **3 optional sections** (services, events, promos) rendered below the main flow. Images are uploaded to the `business-registrations` Supabase Storage bucket at `{userId}/{type}-{timestamp}.{ext}`.
3. On submit, data is inserted into the `business_registration` staging table (status = `pending`)
4. An admin reviews at `/admin`, then approves or rejects
5. **Approve**: `RegistrationDetail` calls the `approve-registration` Edge Function (`supabase/functions/approve-registration/index.ts`) with the user's JWT. The function verifies admin status, then uses the service role to call the `approve_business_registration` SQL stored procedure, which atomically creates `company`, `site`, `business_hours`, categories, amenities, contacts rows and promotes `account.tipo` from `'cliente'` to `'establecimiento'`
6. **Reject**: Done directly via `supabase.update()` in `RegistrationDetail` — sets `status = 'rejected'` and saves `admin_notes` (notes are required for rejection)

**Migrations** (`supabase/migrations/`):
- `20240601000000_business_registration.sql` — `business_registration` table, RLS policies, `approve_business_registration` stored procedure
- `20240602000000_add_services_to_registration.sql` — adds `services JSONB` column (array of `{ id, name, price, duration, charge_type, capacity, description, image_urls[] }`)
- `20240603000000_add_events_to_registration.sql` — adds `events JSONB` column (array of `{ id, titulo, fecha_inicio, fecha_fin, duracion, hora, precio, descripcion, image_urls[] }`)
- `20240604000000_add_promos_to_registration.sql` — adds `promos JSONB` column (array of `{ id, titulo, descripcion, image_url }`)
- `20240604000000_approve_with_images_services_promos.sql` — replaces `approve_business_registration` to also write `logo_url`, gallery images (`site_image`), services + `service_image`, events + `event_image`, and promotions + `promotion_image`. Includes a pre-cleanup step that deletes orphaned rows from previous failed approval attempts before recreating them.
- `20240605000000_add_promotion_img_url.sql` — updates `approve_business_registration` to also set `promotion_img_url` directly on the `promotion` row (in addition to `promotion_image`), so the Flutter app can read it without a JOIN. **Never remove this denormalized column** — the Flutter mobile client depends on it.

**Business Portal** (self-service editing for approved businesses):
1. Once `account.tipo === 'establecimiento'`, the owner can sign in and manage their listing at `/portal/*`, gated by `ProtectedBusinessRoute` (redirects non-business sessions to `/register`, unlike `ProtectedAdminRoute` which redirects to `/`)
2. `useBusinessSites(authId)` (`src/lib/useBusinessSite.ts`) looks up the account's `company`/`site` rows — supports multi-site accounts, surfaced via a site switcher in `PortalHeader`
3. Portal edits are **not** written directly to `service`/`promotion`/`event`/`site` — each Portal page inserts into the `business_edit_request` staging table instead (status = `pending`), mirroring the registration-approval pattern above
4. An admin reviews pending edit requests at `/admin/edits/:id` (`EditRequestDetail`)
5. **Approve**: calls the `approve-edit-request` Edge Function (`supabase/functions/approve-edit-request/index.ts`), which applies the requested create/update/delete to the live table
6. **Reject**: sets `status = 'rejected'` on the `business_edit_request` row

**Migrations** (`supabase/migrations/`), continued:
- `20240607000000_business_edit_requests.sql` — `business_edit_request` table (type: profile/service/promo/event; action: create/update/delete; payload; status: pending/approved/rejected)

**Catalog tables** referenced in RegisterWizard and RegistrationDetail: `category`, `cuisine_type`, `zone`, `additional_services` (used as amenities — note the non-obvious table name).

## Styling

Tailwind CSS v4 via `@tailwindcss/vite`. The theme is defined in `src/styles/theme.css` using `@theme {}`.

**Brand colors** (use via Tailwind classes):
- `wavi-blue`: `#25B3CC`
- `wavi-blue-light`: `#4DD2E8`
- `wavi-blue-dark`: `#198A9E`

**Custom shadows** (use via Tailwind `shadow-*` classes): `shadow-premium`, `shadow-premium-hover`, `shadow-mockup`.

**Font**: Inter (`font-sans`).

**Custom utilities** defined in `theme.css`: `.text-gradient`, `.bg-gradient-premium`, `.glass-card`, `.custom-scrollbar`.

CSS import chain: `src/styles/index.css` → `fonts.css` + `tailwind.css` + `theme.css` + `globals.css`.

The project also includes MUI (`@mui/material`) alongside the shadcn/ui primitives. Prefer the existing shadcn/ui components in `src/app/components/ui/` for new UI work.

## Path alias

`@` resolves to `src/` (configured in `vite.config.ts`).

## Asset imports

- `figma:asset/<filename>` resolves to `src/assets/<filename>` (custom Vite plugin)
- SVG and CSV files can be imported as raw assets

## Deployment

Cloudflare Pages — project `waviweb` (`waviweb.pages.dev`), with `waviapp.com` and `www.waviapp.com` proxied via Cloudflare DNS as CNAMEs to it. `public/_redirects` contains the catch-all redirect so all routes serve `index.html` (Cloudflare Pages honors the same `_redirects` file format Netlify uses).

## Otros directorios (tengo acceso, NO los leas por defecto)

- /Users/harrysg22/Documents/2.Wavi/wavi-management — vault de Obsidian, fuente de verdad para contexto de negocio (VTO, pricing, brand voice). Leé su CLAUDE.md SOLO si el task toca copy, marca, precios o venues. Para bugs y features: no entres.
- /Users/harrysg22/Documents/4.GitHub/wavi_app — la app en Flutter/Dart. Leé su CLAUDE.md SOLO si vas a portar algo entre app y web.

Nunca entres a los dos al tiempo salvo que el task lo pida explícito.

## Al portar código desde el app

- La lógica, los tipos y las llamadas al API se traen casi igual
- La presentación se reescribe con los componentes de este repo
- Nunca copies StyleSheet ni componentes nativos
- Navegación, gestos, permisos y cámara no se portan
