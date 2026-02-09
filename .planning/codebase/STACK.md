# Technology Stack

**Analysis Date:** 2026-02-09

## Languages

**Primary:**
- TypeScript 5.3.0 - Full application codebase, frontend and backend
- JavaScript (JSX/TSX) - React component development

**Secondary:**
- HTML - Markup via React components
- CSS/Tailwind - Styling via Tailwind CSS

## Runtime

**Environment:**
- Node.js 18.0.0+ (required by rpa-server)

**Package Manager:**
- npm - Primary package manager
- Lockfile: Present (package-lock.json exists)

## Frameworks

**Core:**
- Next.js 14.2.29 - React framework, SSR/SSG, API routes
- React 18.2.0 - UI component library
- React DOM 18.2.0 - React DOM bindings

**Styling & UI:**
- Tailwind CSS 3.4.0 - Utility-first CSS framework
- PostCSS 8.4.32 - CSS transformation
- Autoprefixer 10.4.16 - CSS vendor prefixing
- Radix UI (multiple packages) - Headless UI components
  - `@radix-ui/react-dialog` 1.0.5
  - `@radix-ui/react-dropdown-menu` 2.0.6
  - `@radix-ui/react-select` 2.2.6
  - `@radix-ui/react-tabs` 1.1.13
  - `@radix-ui/react-alert-dialog` 1.1.15
  - `@radix-ui/react-avatar` 1.0.4
  - `@radix-ui/react-checkbox` 1.3.3
  - `@radix-ui/react-label` 2.1.8
  - `@radix-ui/react-popover` 1.1.15
  - `@radix-ui/react-scroll-area` 1.0.5
  - `@radix-ui/react-separator` 1.0.3
  - `@radix-ui/react-switch` 1.2.6
  - `@radix-ui/react-tooltip` 1.0.7
  - Other Radix utilities for composable components
- Lucide React 0.303.0 - Icon library
- Sonner 2.0.7 - Toast notifications
- Tailwind Merge 2.2.0 - Merge Tailwind class utilities
- Tailwind CSS Animate 1.0.7 - Animation utilities
- Class Variance Authority 0.7.0 - Component style composition
- CLSX 2.1.0 - Conditional className builder

**Testing:**
- Vitest 1.2.0 - Unit test framework
- `@vitest/coverage-v8` 1.2.0 - Code coverage reporting

**Build/Dev:**
- TypeScript 5.3.0 - Type checking and compilation
- ESLint 8.56.0 - JavaScript/TypeScript linting
- `eslint-config-next` 14.2.29 - Next.js ESLint configuration
- `@types/*` packages - TypeScript type definitions

## Key Dependencies

**Critical:**
- `@supabase/ssr` 0.0.10 - Server-side Supabase integration
- `@supabase/supabase-js` 2.39.3 - Supabase client SDK
- `@supabase/auth-helpers-nextjs` 0.15.0 - Supabase auth for Next.js
- `@supabase/auth-helpers-react` 0.15.0 - Supabase auth React hooks
- OpenAI 6.16.0 - GPT integration for AI chat and document analysis

**PDF & Document Processing:**
- `jspdf` 4.0.0 - PDF generation
- `jspdf-autotable` 5.0.7 - PDF table generation plugin
- `pdf-parse` 2.4.5 - PDF parsing and text extraction
- `file-saver` 2.0.5 - Browser file download utility

**Data & Export:**
- `xlsx` 0.18.5 - Excel file reading and writing

**Date/Time:**
- `date-fns` 4.1.0 - Date utility functions
- `react-day-picker` 9.13.0 - Date picker component

**Data Visualization:**
- Recharts 3.6.0 - React chart library

**RPA Server (rpa-server/):**
- Express 4.18.2 - Web server framework
- Playwright 1.40.0 - Browser automation
- Playwright Extra 4.3.6 - Playwright extensions
- Puppeteer Extra Plugin Stealth 2.11.2 - Anti-detection for browser automation
- UUID 9.0.1 - UUID generation
- Winston 3.11.0 - Structured logging
- CORS 2.8.5 - Cross-origin request handling
- Helmet 7.1.0 - Security headers
- Express Rate Limit 7.1.5 - Rate limiting middleware
- dotenv 16.3.1 - Environment variable loading
- Supabase JS 2.38.0 - Database client in RPA server

## Configuration

**Environment:**
- Environment file: `.env` (not committed)
- Example config: `.env.example` and `.env.production.example` available

**Key Environment Variables Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role (backend only)
- `OPENAI_API_KEY` - OpenAI API key for GPT integration
- `NUBOX_API_URL` - Nubox API endpoint
- `NUBOX_PARTNER_TOKEN` - Nubox authentication token
- `NUBOX_COMPANY_API_KEY` - Nubox company API key
- `NUBOX_WEBHOOK_SECRET` - Webhook signature verification secret
- `WEBHOOK_SECRET` - General webhook authentication
- Email provider configuration (SMTP, SendGrid, AWS SES, or Mailgun)
- RPA server webhook URL and credentials

**Build:**
- Next.js config: `/home/tomas/Escritorio/HV_Consultores/next.config.js`
  - Image optimization enabled for Supabase storage
  - Webpack externals configured for pdf-parse
  - Symlink resolution disabled (Windows compatibility)
- TypeScript config: `/home/tomas/Escritorio/HV_Consultores/tsconfig.json`
  - Strict mode enabled
  - Path alias: `@/*` → `./src/*`
- Tailwind config: `/home/tomas/Escritorio/HV_Consultores/tailwind.config.ts`
  - Dark mode via class selector
  - Custom theme extensions (sidebar, executive shadows)
- PostCSS config: `/home/tomas/Escritorio/HV_Consultores/postcss.config.js`
- Vitest config: `/home/tomas/Escritorio/HV_Consultores/vitest.config.ts`

**RPA Server Build:**
- TypeScript config: `/home/tomas/Escritorio/HV_Consultores/rpa-server/tsconfig.json`
- Build output: `dist/` directory
- Entry point: `src/index.ts`

## Platform Requirements

**Development:**
- Node.js 18.0.0 or higher
- npm or compatible package manager
- Modern web browser (Chrome/Edge recommended for Next.js dev server)

**Production:**
- Node.js 18.0.0+ runtime
- Vercel (recommended for Next.js deployment) or Node.js hosting
- Supabase PostgreSQL instance
- Browser/Playwright capability for RPA server (headless Chrome/Firefox)
- Network access to:
  - Supabase API (`gifmgwaogpamdeeiymup.supabase.co`)
  - OpenAI API (`api.openai.com`)
  - Nubox API (`api.nubox.com`)
  - SII Portal (for RPA automation)
  - Email providers (SMTP, SendGrid, SES, or Mailgun)

**Storage:**
- Supabase Cloud Storage for file uploads and document storage
- PostgreSQL database (Supabase managed)

---

*Stack analysis: 2026-02-09*
