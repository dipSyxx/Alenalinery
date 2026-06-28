# Service-first dark editorial landing design

## Status

Approved visual direction: dark editorial. The mobile hero concept approved on 2026-06-22 is the visual anchor for the landing page.

## Goal

Replace the current warm, placeholder-led home page with a mobile-first landing page that establishes Alenalinery as a premium hair-colour studio in Uman and routes visitors to the existing `/booking` flow.

## Scope

- Keep the existing public services, booking, and admin routes unchanged.
- Redesign only the landing page and its shared public chrome where required for a coherent landing experience.
- Prioritize colourist services: complex colouring, toning, keratin treatment, hair botox, and consultations.
- Defer product catalogue, e-commerce, checkout, and fragrance/care-product promotion.

## Audience and conversion

The primary visitor is a mobile user looking for a colourist or restorative hair service in Uman. The primary conversion is navigating to `/booking`; the secondary conversion is viewing `/services`.

## Visual system

- **Background:** near-black `#090606`, with controlled dark wine-red `#3D070C` / `#670A12` editorial image zones. White content sections are true white, not cream.
- **Typography:** Manrope remains the functional typeface. Hero and section display copy switches from the current high-contrast serif to uppercase/near-uppercase, compact sans-serif editorial display styling.
- **Geometry:** open full-bleed bands and linear dividers. Avoid default card grids, rounded section containers, badges, and decorative metrics.
- **Actions:** one dominant white rounded booking button on dark areas; compact outlined action on light areas. All buttons have a minimum 44px touch target.
- **Images:** high-detail editorial hair photography, with a single strong image per section. No product packaging or product-first imagery.
- **Motion:** subtle reveal and hover movement only; respect `prefers-reduced-motion`.

## Information architecture

1. **Dark hero**
   - Brand header: `Alenalinery`, concise desktop links, booking action, accessible mobile drawer.
   - Exact hero copy: `КОЛІР, ЩО ВІДЧУВАЄТЬСЯ.`, `ФАРБУВАННЯ · КЕРАТИН · БОТОКС`, `Записатися онлайн`.
   - A full-bleed editorial hair-colour image is the visual focal point.
   - The CTA links directly to `/booking`.

2. **Service directions**
   - Light section with a large statement and a numbered open list for `Складне фарбування`, `Відновлення`, and `Догляд та консультація`.
   - Each row has a concise outcome-focused description and links to `/services`; no prices or product merchandising on the landing page.

3. **Studio approach**
   - Dark or white editorial split layout pairing an image of professional colour work with a short explanation of consultation, diagnosis, and a tailored plan.
   - Reinforce that the studio works with the individual condition and goal of the client’s hair.

4. **Portfolio preview**
   - An asymmetric editorial gallery slot that will hold real hair-result photography. It is a visual proof section, not a product gallery.
   - Until final approved portfolio photos exist, use clearly labelled, deliberately styled placeholder frames.

5. **Booking close**
   - A high-contrast final band with a single booking CTA to `/booking` and restrained explanatory copy.

6. **Contacts and footer**
   - Preserve Uman, Ukraine and add only verified contact/social destinations when they are provided. Do not invent an address, telephone number, or social URL.

## Responsive behavior

- Mobile is the source layout: 16px side gutter, compact header, one-column reading order, hero CTA at the end of the visible hero, and no horizontal overflow.
- From `sm`, enlarge copy and image framing while preserving the same reading order.
- From `lg`, show concise navigation and compose the hero in two columns without moving the primary CTA away from the title.

## Technical approach

- Retain Next.js, Tailwind v4 utilities, existing `SiteHeader`, `SiteFooter`, `/services`, and `/booking` routes.
- Replace only landing-specific markup and styles; do not alter booking API contracts or service data fetching.
- Keep hero, studio approach, and portfolio media as explicit placeholders until approved studio photography is supplied. Keep controls, navigation, headings, and CTAs as semantic code-native UI.
- Update shared chrome to support a dark landing variant without breaking its light pages.

## Accessibility and quality gates

- Use semantic `header`, `main`, `section`, and heading order.
- Keep text contrast compliant against dark imagery, include meaningful image alt text, and retain visible focus indicators.
- Verify keyboard-operable mobile navigation and each CTA path to `/booking` and `/services`.
- Validate mobile and desktop layouts, typecheck, lint, and production build. No new tests will be added because the project instruction explicitly excludes test-suite expansion for this request.

## Deliberate exclusions

- No online shop, product cards, carousel, shopping cart, checkout, testimonials, pricing table, map, or unverified social/contact links.
- No changes to booking availability, booking form behavior, services API, Supabase schema, or admin features.

## Temporary media decision

On 2026-06-22, the owner chose to defer generated and production photography. The redesigned landing therefore uses deliberately styled, labelled image placeholders for the hero, studio approach, and portfolio sections. Replace them with approved studio photography before a public production launch.
