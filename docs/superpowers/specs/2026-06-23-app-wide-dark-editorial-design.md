# App-wide dark editorial design system

## Goal

Extend the approved Alenalinery dark-editorial visual language from the landing page to every browser-visible route while preserving all current booking and admin behavior.

## Scope

### Public routes

- /services
- /booking
- /booking/success
- shared SiteHeader and SiteFooter
- ServicesBrowser and BookingFlow

### Admin routes

- /admin/login
- /admin
- /admin/bookings
- /admin/schedule
- /admin/services
- shared admin shell, booking workspace, sheets, manual-booking sheet, schedule editor, status badges, and form controls used by those routes

API routes, Supabase data access, validation, authentication, booking mutation behavior, URL contracts, and data schemas are out of scope.

## Design system

src/app/globals.css becomes the sole colour definition point. It defines semantic custom properties for:

- studio-canvas — deepest editorial page background.
- studio-canvas-raised — dark operational sidebar and elevated dark regions.
- studio-surface — light working surface.
- studio-surface-raised — cards, forms, sheets, and dialogs.
- studio-ink and studio-muted — primary and secondary readable text.
- studio-accent and studio-accent-strong — wine-red interactive emphasis.
- studio-border — non-decorative separators and control borders.
- studio-success, studio-warning, and studio-danger — status feedback.

Those custom properties are exposed through the Tailwind theme as bg-studio-*, text-studio-*, border-studio-*, and ring-studio-*. Components must consume semantic token utilities or CSS variables only. Local arbitrary hex classes such as bg-[#090606], bespoke component hex values, and inline background colours are prohibited.

The global Shadcn semantic properties (--background, --card, --primary, --secondary, --muted, --border, --ring, and destructive colour) map onto this token system so existing primitives adapt without API changes.

## Public experience

Public routes use a dark header and footer, an editorial title block, and true-light content surfaces that create contrast without product merchandising.

- The services page becomes a service index: dark introduction, light service browser surface, and direct booking affordances.
- The booking route becomes a guided appointment workspace: dark route frame and progress rail, light form surface, clear selected, pending, and error states.
- The booking-success route becomes a focused confirmation surface with appointment details and a single return action.

The existing mobile menu, /services link, /booking link, booking request lifecycle, form validation, availability loading, and confirmation query parameters remain unchanged.

## Admin experience

Admin remains dense and task-oriented. It does not reuse the marketing hero or oversized public page rhythm.

- AdminShell uses a dark token-driven sidebar and mobile rail, with a neutral high-contrast work canvas.
- Dashboard counts become compact operational metrics using shared panels rather than isolated white cards.
- Bookings, schedule, and catalogue use the same panel, divider, selected-state, status, dialog, and control vocabulary.
- Sheets and manual forms remain functionally identical, but share colour, border, focus, and action conventions with the rest of the application.

Desktop navigation remains a sidebar; mobile navigation remains fixed at the bottom with 44px-or-larger targets.

## Responsive and accessibility requirements

- Public layouts remain mobile-first, with 16px minimum gutters and no horizontal overflow.
- Admin retains mobile-friendly bottom navigation and sufficient main bottom padding.
- Focus indicators use the global studio ring token.
- Text, status, selected controls, errors, and disabled states maintain readable contrast on their assigned surfaces.
- Every current interactive control, sheet, calendar, selection state, and form validation state remains functional.

## Implementation boundaries

- Introduce small route/frame class families in globals.css; do not scatter duplicate visual rules across components.
- Do not replace functional components with static mockups or change their client/server boundary.
- Do not add image generation, product catalogue UI, payment, new data fields, new routes, or external links.
- Do not expand the test suite; the project requirement excludes new tests for this redesign.

## Validation

- Run typecheck, lint, current test suite, and production build.
- Use the approved landing design as the visual system reference.
- Inspect public mobile/desktop, booking flow states, and admin mobile/desktop once a user-authorized preview is available.

## Implemented inventory

- `src/app/globals.css` owns the studio colour tokens, Tailwind mappings, public route surfaces, booking workspace, and admin panel classes.
- Shared public chrome now uses semantic studio tokens, and `PublicPageFrame` provides the dark public introduction with a light working surface.
- Services, booking, and booking-success use the shared public frame while preserving their service fetches, booking lifecycle, and confirmation parameters.
- Admin login, navigation shell, dashboard, bookings, schedule, and service catalogue use the operational canvas, panel, and heading vocabulary.
- Booking workspace rows, detail/manual sheets, schedule controls, and status badges consume the same semantic status, border, surface, and accent roles.
