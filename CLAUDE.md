# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build (outputs to dist/)
```

No test suite is configured.

## Environment variables

Required in `.env.local`:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase publishable key
- `VITE_GOOGLE_MAPS_KEY` — Google Maps Places API key (used in RegisterWizard for address autocomplete)

Only `VITE_`-prefixed vars are exposed to the browser by Vite.

## Architecture

This is a React + Vite + TypeScript marketing/landing page for the Wavi mobile app, deployed on Netlify.

**Entry point**: `src/main.tsx` → `src/app/App.tsx` → React Router → pages

**Routes** (`src/app/routes.tsx`):
- `/` — `Home` (main landing page)
- `/terminos-y-condiciones` — Terms and Conditions
- `/politica-de-privacidad` — Privacy Policy
- `/descargar` — Download page
- `/register` — `RegisterWizard` (multi-step business onboarding form)
- `/register/done` — `RegisterSuccess` (post-submission confirmation)
- `/admin` — `AdminDashboard` (protected; lists business registrations by status)
- `/admin/:id` — `RegistrationDetail` (protected; review and approve/reject a single registration)

**Home page** (`src/app/pages/Home.tsx`) is a single scrollable page composed of ordered section components: `Navbar → HeroSection → AboutUsSection → DownloadAppSection → ExperiencesSection → BenefitsSection → BusinessSection → TestimonialsSection → FinalCTASection → Footer`. Hash-based scroll navigation is handled via `useLocation`.

**Component layers**:
- `src/app/components/` — page-specific section components
- `src/app/components/ui/` — generic shadcn/ui-style primitives (Radix UI + Tailwind wrappers)
- `src/app/components/figma/` — Figma-originated helpers (e.g. `ImageWithFallback`)

## Supabase backend

`src/lib/supabase.ts` exports a single `supabase` client used across all pages.

**Admin auth**: `ProtectedAdminRoute` calls `supabase.auth.getSession()` and then queries the `account` table for `tipo === 'admin'`. Non-admin sessions are redirected to `/`.

**Business registration flow**:
1. User authenticates via OAuth (Google/Apple) on `/register`
2. `RegisterWizard` collects business info across 7 sections and uploads images to the `business-registrations` Supabase Storage bucket
3. On submit, data is inserted into the `business_registration` staging table (status = `pending`)
4. An admin reviews at `/admin`, then approves or rejects
5. Approval calls the `approve_business_registration` stored procedure (SECURITY DEFINER), which atomically creates `company`, `site`, `business_hours`, categories, amenities, contacts rows and promotes the user's `account.tipo` from `'cliente'` to `'establecimiento'`

The migration in `supabase/migrations/20240601000000_business_registration.sql` defines the table schema, RLS policies, and the approval function.

## Styling

Tailwind CSS v4 via `@tailwindcss/vite`. The theme is defined in `src/styles/theme.css` using `@theme {}`.

**Brand colors** (use via Tailwind classes):
- `wavi-blue`: `#25B3CC`
- `wavi-blue-light`: `#4DD2E8`
- `wavi-blue-dark`: `#198A9E`

**Custom utilities** defined in `theme.css`: `.text-gradient`, `.bg-gradient-premium`, `.glass-card`, `.custom-scrollbar`.

CSS import chain: `src/styles/index.css` → `fonts.css` + `tailwind.css` + `theme.css`.

The project also includes MUI (`@mui/material`) alongside the shadcn/ui primitives. Prefer the existing shadcn/ui components in `src/app/components/ui/` for new UI work.

## Path alias

`@` resolves to `src/` (configured in `vite.config.ts`).

## Asset imports

- `figma:asset/<filename>` resolves to `src/assets/<filename>` (custom Vite plugin)
- SVG and CSV files can be imported as raw assets

## Deployment

Netlify SPA — `public/_redirects` contains the catch-all redirect so all routes serve `index.html`.
