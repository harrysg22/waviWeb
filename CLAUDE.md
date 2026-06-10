# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build (outputs to dist/)
```

No test suite is configured.

## Architecture

This is a React + Vite + TypeScript marketing/landing page for the Wavi mobile app, deployed on Netlify.

**Entry point**: `src/main.tsx` → `src/app/App.tsx` → React Router → pages

**Routes** (`src/app/routes.tsx`):
- `/` — `Home` (main landing page)
- `/terminos-y-condiciones` — Terms and Conditions
- `/politica-de-privacidad` — Privacy Policy
- `/descargar` — Download page

**Home page** (`src/app/pages/Home.tsx`) is a single scrollable page composed of ordered section components: `Navbar → HeroSection → AboutUsSection → DownloadAppSection → ExperiencesSection → BenefitsSection → BusinessSection → TestimonialsSection → FinalCTASection → Footer`. Hash-based scroll navigation is handled via `useLocation`.

**Component layers**:
- `src/app/components/` — page-specific section components
- `src/app/components/ui/` — generic shadcn/ui-style primitives (Radix UI + Tailwind wrappers)
- `src/app/components/figma/` — Figma-originated helpers (e.g. `ImageWithFallback`)

## Styling

Tailwind CSS v4 via `@tailwindcss/vite`. The theme is defined in `src/styles/theme.css` using `@theme {}`.

**Brand colors** (use via Tailwind classes):
- `wavi-blue`: `#25B3CC`
- `wavi-blue-light`: `#4DD2E8`
- `wavi-blue-dark`: `#198A9E`

**Custom utilities** defined in `theme.css`: `.text-gradient`, `.bg-gradient-premium`, `.glass-card`, `.custom-scrollbar`.

CSS import chain: `src/styles/index.css` → `fonts.css` + `tailwind.css` + `theme.css`.

## Path alias

`@` resolves to `src/` (configured in `vite.config.ts`).

## Asset imports

- `figma:asset/<filename>` resolves to `src/assets/<filename>` (custom Vite plugin)
- SVG and CSV files can be imported as raw assets

## Deployment

Netlify SPA — `public/_redirects` contains the catch-all redirect so all routes serve `index.html`.
