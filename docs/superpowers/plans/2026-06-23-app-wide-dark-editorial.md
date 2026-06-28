# App-wide Dark Editorial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Redesign all public and admin UI routes with one token-driven dark-editorial system while retaining every booking and admin workflow.

**Architecture:** A semantic studio token layer in globals.css drives Tailwind and Shadcn variables. Public routes use a common editorial frame; booking and admin retain their existing workflow components but consume shared route, panel, selected-state, and status classes.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Shadcn/Radix UI, React Hook Form, Vitest.

---

## File structure

- Modify: src/app/globals.css
- Modify: src/components/site-header.tsx
- Modify: src/components/site-footer.tsx
- Create: src/components/public-page-frame.tsx
- Modify: src/app/services/page.tsx
- Modify: src/components/services-browser.tsx
- Modify: src/app/booking/page.tsx
- Modify: src/app/booking/success/page.tsx
- Modify: src/components/booking-flow.tsx
- Modify: src/app/admin/login/page.tsx
- Modify: src/components/admin-login-form.tsx
- Modify: src/components/admin-shell.tsx
- Modify: src/app/admin/(protected)/page.tsx
- Modify: src/app/admin/(protected)/bookings/page.tsx
- Modify: src/app/admin/(protected)/schedule/page.tsx
- Modify: src/app/admin/(protected)/services/page.tsx
- Modify: src/components/admin-bookings-workspace.tsx
- Modify: src/components/admin-booking-sheet.tsx
- Modify: src/components/admin-manual-booking-sheet.tsx
- Modify: src/components/schedule-editor.tsx
- Modify: src/components/booking-status-badge.tsx
- Modify: docs/superpowers/specs/2026-06-23-app-wide-dark-editorial-design.md

No test files are created or changed because the project instruction explicitly excludes test-suite expansion.

### Task 1: Define the global studio token layer

**Files:**
- Modify: src/app/globals.css:7-120

- [ ] **Step 1: Define semantic colour roles in the root scope.**

~~~css
:root {
  --studio-canvas: #090606;
  --studio-canvas-raised: #1b080b;
  --studio-surface: #fff;
  --studio-surface-raised: #f7f4f4;
  --studio-ink: #1a1516;
  --studio-muted: #706668;
  --studio-accent: #8b101a;
  --studio-accent-strong: #5e090f;
  --studio-accent-soft: #f4e6e8;
  --studio-border: #ded5d6;
  --studio-success: #2f6b4e;
  --studio-warning: #915a17;
  --studio-danger: #ae3030;
}
~~~

- [ ] **Step 2: Map existing application and Shadcn properties to the semantic tokens.**

~~~css
:root {
  --background: var(--studio-surface);
  --surface: var(--studio-surface-raised);
  --ink: var(--studio-ink);
  --muted: var(--studio-accent-soft);
  --line: var(--studio-border);
  --accent: var(--studio-accent);
  --accent-strong: var(--studio-accent-strong);
  --card: var(--studio-surface);
  --popover: var(--studio-surface);
  --primary: var(--studio-accent);
  --secondary: var(--studio-accent-soft);
  --destructive: var(--studio-danger);
  --border: var(--studio-border);
  --ring: var(--studio-accent);
}
~~~

- [ ] **Step 3: Expose studio roles through the inline Tailwind theme.**

Add --color-studio-canvas, --color-studio-canvas-raised, --color-studio-surface, --color-studio-surface-raised, --color-studio-ink, --color-studio-muted, --color-studio-accent, --color-studio-accent-strong, --color-studio-accent-soft, --color-studio-border, --color-studio-success, --color-studio-warning, and --color-studio-danger. Every value must reference a root custom property.

- [ ] **Step 4: Replace landing CSS literals with semantic variables.**

The landing shell, frame, buttons, light sections, service rows, booking band, and contacts must use var(--studio-*) only. Keep literal colours solely in the root token block.

- [ ] **Step 5: Add reusable route and panel classes.**

~~~css
.public-page { min-height: 100svh; background: var(--studio-canvas); color: var(--studio-surface); }
.public-page__hero { border-bottom: 1px solid color-mix(in oklch, var(--studio-surface) 14%, transparent); padding-block: clamp(3.5rem, 9vw, 7rem); }
.public-page__surface { background: var(--studio-surface); color: var(--studio-ink); }
.booking-workspace { border: 1px solid var(--studio-border); background: var(--studio-surface); color: var(--studio-ink); }
.admin-canvas { min-height: 100svh; background: var(--studio-surface-raised); color: var(--studio-ink); }
.admin-panel { border: 1px solid var(--studio-border); background: var(--studio-surface); }
.admin-page-title { font-family: var(--font-manrope), sans-serif; font-weight: 700; letter-spacing: -.055em; line-height: .92; }
~~~

- [ ] **Step 6: Verify application components have no arbitrary colour classes.**

Run:

~~~powershell
if (rg -n 'bg-\[|text-\[|border-\[' src/app src/components --glob '*.tsx') { exit 1 }
Write-Output 'No arbitrary application colour classes found.'
~~~

Expected: exit code 0.

### Task 2: Tokenize shared public chrome and create a route frame

**Files:**
- Modify: src/components/site-header.tsx:16-86
- Modify: src/components/site-footer.tsx:3-35
- Create: src/components/public-page-frame.tsx

- [ ] **Step 1: Replace current dark header/footer literal classes.**

The dark header uses bg-studio-canvas, text-studio-surface, and border-studio-surface/10. The dark CTA uses border-studio-surface/60, hover:bg-studio-surface, and hover:text-studio-canvas. The dark footer uses bg-studio-canvas and text-studio-surface. Keep the light variants, current href values, mobile Sheet, and aria labels.

- [ ] **Step 2: Add the reusable public frame.**

~~~tsx
import type { ReactNode } from "react";

type PublicPageFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function PublicPageFrame({ eyebrow, title, description, children }: PublicPageFrameProps) {
  return (
    <main className="public-page">
      <section className="public-page__hero">
        <div className="landing-container">
          <p className="landing-overline">{eyebrow}</p>
          <h1 className="landing-display mt-4">{title}</h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-studio-surface/70 sm:text-base">{description}</p>
        </div>
      </section>
      <section className="public-page__surface">{children}</section>
    </main>
  );
}
~~~

- [ ] **Step 3: Verify the shared frame typechecks.**

Run: npm.cmd run typecheck
Expected: exit code 0.

### Task 3: Redesign services and booking routes

**Files:**
- Modify: src/app/services/page.tsx:1-22
- Modify: src/components/services-browser.tsx:1-126
- Modify: src/app/booking/page.tsx:1-21
- Modify: src/app/booking/success/page.tsx:1-44
- Modify: src/components/booking-flow.tsx:173-490

- [ ] **Step 1: Put services and booking pages in the public frame.**

Both pages render SiteHeader with dark variant, PublicPageFrame, their existing workflow component inside landing-container with vertical padding, and SiteFooter with dark variant. Preserve the exact title and descriptive copy already shown to visitors.

- [ ] **Step 2: Convert ServicesBrowser to editorial service rows.**

Use border-studio-border row separators, text-studio-accent booking actions, and token-based loading/error surfaces. Preserve category grouping, API fetch, loading skeleton, error state, prices, duration, consultation marker, and booking href.

- [ ] **Step 3: Convert BookingFlow to a token-driven workspace.**

Set the root container to booking-workspace with existing grid breakpoints and padding. Use text-studio-accent for current progress, text-studio-ink for complete progress, text-studio-muted for pending progress, border-studio-accent plus bg-studio-accent-soft for selected service cards, and border-studio-border plus bg-studio-surface for unselected cards. Do not alter state variables, useEffect dependencies, fetch paths, validation, router push, or form fields.

- [ ] **Step 4: Restyle booking success.**

Use PublicPageFrame, admin-panel for appointment details, token-driven CheckCircle2 styling, and the existing return Link. Keep search parameter parsing and formatKyivDateTime unchanged.

- [ ] **Step 5: Verify public flow behavior.**

Run:

~~~powershell
npm.cmd run typecheck
npm.cmd test
~~~

Expected: typecheck exits 0; Vitest reports 7 passed files and 40 passed tests.

### Task 4: Redesign the admin frame and route headers

**Files:**
- Modify: src/app/admin/login/page.tsx:1-18
- Modify: src/components/admin-login-form.tsx:1-38
- Modify: src/components/admin-shell.tsx:1-84
- Modify: src/app/admin/(protected)/page.tsx:42-65
- Modify: src/app/admin/(protected)/bookings/page.tsx:42-48
- Modify: src/app/admin/(protected)/schedule/page.tsx:10-16
- Modify: src/app/admin/(protected)/services/page.tsx:8-47

- [ ] **Step 1: Apply admin canvas and panel classes to login.**

Use admin-canvas as the login page root and an admin-panel Card. Use admin-page-title for the heading. Preserve signInAdmin, Input names, autocomplete values, error Alert, and pending state.

- [ ] **Step 2: Tokenize AdminShell.**

Use admin-canvas on the shell root and bg-studio-canvas-raised for desktop sidebar, mobile header, and mobile bottom nav. The active navigation class is bg-studio-surface/10 text-studio-surface; the inactive class is text-studio-surface/65 hover:bg-studio-surface/5 hover:text-studio-surface. Preserve sidebar layout, mobile bottom navigation, path matching, and safe-area padding.

- [ ] **Step 3: Apply admin-page-title and admin-panel to protected pages.**

Dashboard metrics, booking workspace wrappers, schedule content, and catalogue tabs use admin-panel and token divider classes. Preserve all Supabase calls, status calculations, date parsing, category tabs, and existing responsive layout.

- [ ] **Step 4: Verify protected route data contracts remain present.**

Run:

~~~powershell
rg -n 'getAdminBookings|getWorkingHours|getAdminServiceCategories|AdminBookingsWorkspace|ScheduleEditor' src/app/admin
~~~

Expected: every existing data query and workspace/editor component remains present.

### Task 5: Normalize admin workspaces, sheets, forms, and statuses

**Files:**
- Modify: src/components/admin-bookings-workspace.tsx:1-170
- Modify: src/components/admin-booking-sheet.tsx:1-360
- Modify: src/components/admin-manual-booking-sheet.tsx:1-224
- Modify: src/components/schedule-editor.tsx:1-200
- Modify: src/components/booking-status-badge.tsx
- Modify: affected UI primitives only when they bypass semantic Shadcn variables.

- [ ] **Step 1: Replace literal white booking rows and empty surfaces.**

Use bg-studio-surface, border-studio-border, hover:border-studio-accent, and hover:bg-studio-surface-raised in AdminBookingsWorkspace. Preserve client-side date selection, filters, manual create sheet, booking sheet, and refresh logic.

- [ ] **Step 2: Apply panel/action tokens to sheets and schedule editor.**

Use token-driven background, border, focus, destructive, and accent classes for all Sheet, Dialog, schedule block, and manual booking states. Preserve fetch calls, mutation body values, error handling, toasts, and post-success refresh behavior.

- [ ] **Step 3: Centralize status appearance in BookingStatusBadge.**

Map PENDING to studio-warning, CONFIRMED to studio-success, COMPLETED to studio-accent-soft and studio-accent, CANCELLED and NO_SHOW to studio-danger, and EXPIRED to studio-surface-raised and studio-muted. Keep status labels and status types unchanged.

- [ ] **Step 4: Verify styling changes did not alter requests.**

Run:

~~~powershell
git diff -- src/components/admin-bookings-workspace.tsx src/components/admin-booking-sheet.tsx src/components/admin-manual-booking-sheet.tsx src/components/schedule-editor.tsx | rg '^[+-].*(fetch|/api/|method:|body:|router\.)'
~~~

Expected: no output.

### Task 6: Record and verify the migration

**Files:**
- Modify: docs/superpowers/specs/2026-06-23-app-wide-dark-editorial-design.md

- [ ] **Step 1: Append the implemented inventory.**

Append a section naming globals.css token definitions; shared public chrome/frame; services, booking, and success; admin login/shell/routes; and admin workspaces, sheets, schedule, and status components.

- [ ] **Step 2: Run full non-interactive verification.**

Run:

~~~powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
git diff --check
~~~

Expected: every command exits 0; Vitest reports 7 passed files and 40 passed tests.

- [ ] **Step 3: Audit global colour token adoption.**

Run:

~~~powershell
if (rg -n 'bg-\[|text-\[|border-\[|#[0-9a-fA-F]{3,8}' src/app src/components --glob '*.tsx' --glob '*.css') { exit 1 }
Write-Output 'Application components use global colour tokens only.'
~~~

Expected: no arbitrary class or local hex literal outside globals.css.

- [ ] **Step 4: Perform visual QA only in a user-authorized preview.**

Inspect services, all booking steps, booking success, admin login, dashboard, bookings, schedule, and services at mobile and desktop widths. Confirm no clipped actions, accessible admin bottom navigation, and intact booking/admin interactions. Do not start a dev server unless the user explicitly requests it.

- [ ] **Step 5: Review final repository state.**

Run:

~~~powershell
git status --short
git diff --check
~~~

Expected: no whitespace errors. Local commits remain deferred while .git/index write access is unavailable.

