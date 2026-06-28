# Service-first Dark Editorial Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Deliver a mobile-first dark-editorial Alenalinery home page that promotes hair services and routes visitors to the existing online booking flow.

**Architecture:** Keep service, booking, and admin contracts intact. Add generated image assets and a typed landing content module, make the shared header theme-aware, and replace only the home-page composition and scoped landing styles.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, next/image, Lucide, built-in Image Gen.

---

## File structure

- Create: public/images/landing/hero-colourist-v1.png — standalone dark editorial hero photograph.
- Create: public/images/landing/studio-colour-work-v1.png — studio approach photograph.
- Create: public/images/landing/portfolio-brunette-v1.png — portfolio image.
- Create: public/images/landing/portfolio-copper-v1.png — portfolio image.
- Create: public/images/landing/portfolio-blonde-v1.png — portfolio image.
- Create: src/components/landing/content.ts — typed landing copy and image metadata.
- Modify: src/components/site-header.tsx:1-72 — add a dark header variant.
- Modify: src/app/page.tsx:1-136 — replace all placeholder-led landing markup.
- Modify: src/app/globals.css:89-120 — add scoped landing primitives.
- Modify: docs/superpowers/specs/2026-06-22-service-first-dark-editorial-landing-design.md — record final asset paths.

No test file is created or changed: the project instruction explicitly excludes test-suite expansion for this request.

> **Implementation update — 2026-06-22:** At the owner’s request, skip generated images and do not add image files to the repository. Render deliberately styled, labelled placeholders until approved studio photography is provided.

### Task 1: Generate and validate standalone image assets

**Files:**
- Create: public/images/landing/hero-colourist-v1.png
- Create: public/images/landing/studio-colour-work-v1.png
- Create: public/images/landing/portfolio-brunette-v1.png
- Create: public/images/landing/portfolio-copper-v1.png
- Create: public/images/landing/portfolio-blonde-v1.png

- [ ] **Step 1: Generate the hero image.**

Use the built-in Image Gen tool, then inspect the output with view_image:

~~~text
Use case: photorealistic-natural
Asset type: service-studio landing page hero
Primary request: premium editorial photograph for Alenalinery, a Ukrainian hair-colour studio in Uman. Show the back and slight side of a client with long glossy deep brunette hair; one colourist hand gently separates a hair section at the edge.
Scene/backdrop: near-black studio with a controlled deep wine-red light falloff.
Composition/framing: portrait 2:3; subject aligned to the right; clean dark negative space on the left.
Lighting/mood: cinematic low-key beauty editorial, refined and intimate.
Constraints: no face, no bottle, no cosmetics packaging, no logo, no lettering, no watermark, no generic product advertising.
~~~

- [ ] **Step 2: Generate the studio approach image.**

~~~text
Use case: photorealistic-natural
Asset type: service-studio approach section
Primary request: close editorial photograph of a professional colourist in a black apron consulting over a client's long hair. Centre diagnostic attention to texture and colour; do not show the client's face.
Scene/backdrop: minimal dark salon interior without readable signage or product display.
Composition/framing: portrait 4:5, hands and hair in sharp focus.
Lighting/mood: quiet, premium, directional warm-neutral salon light.
Constraints: no logo, no text, no product packaging, no watermark, no stock-photo smile at camera.
~~~

- [ ] **Step 3: Generate and inspect the three portfolio result images.**

Generate one vertical 4:5 image per prompt:

~~~text
Use case: photorealistic-natural
Asset type: hair-colour portfolio image
Primary request: back-view editorial result of long healthy brunette hair with dimensional espresso and soft burgundy undertones after professional colouring.
Scene/backdrop: dark near-black studio backdrop.
Lighting/mood: high-detail beauty editorial, realistic texture and shine.
Constraints: no face, no text, no logo, no watermark, no product packaging.
~~~

~~~text
Use case: photorealistic-natural
Asset type: hair-colour portfolio image
Primary request: back-view editorial result of medium-long copper hair with natural soft dimension and glossy movement after professional colouring.
Scene/backdrop: restrained warm charcoal studio backdrop.
Lighting/mood: high-detail beauty editorial, realistic texture and shine.
Constraints: no face, no text, no logo, no watermark, no product packaging.
~~~

~~~text
Use case: photorealistic-natural
Asset type: hair-colour portfolio image
Primary request: back-view editorial result of long cool beige-blonde hair with a soft lived-in root blend after professional colouring.
Scene/backdrop: neutral dark-grey studio backdrop.
Lighting/mood: high-detail beauty editorial, realistic texture and shine.
Constraints: no face, no text, no logo, no watermark, no product packaging.
~~~

- [ ] **Step 4: Copy the approved assets into the workspace.**

Create the target directory and copy the selected image outputs to the five exact paths above. Each accepted image must be inspected with view_image and must have coherent hair anatomy, no embedded UI text, no product packaging, and a crop suitable for its target section.

Run:

~~~powershell
Get-ChildItem public/images/landing -File | Select-Object Name, Length
~~~

Expected: five non-zero-byte image files.

### Task 2: Add typed landing data

**Files:**
- Create: src/components/landing/content.ts

- [ ] **Step 1: Create the data module.**

~~~ts
export const landingServices = [
  {
    number: "01",
    title: "Складне фарбування",
    description: "Точний відтінок, м’які переходи й техніка, підібрана до вашого волосся.",
  },
  {
    number: "02",
    title: "Відновлення",
    description: "Кератин і ботокс для гладкості, блиску та слухняності без універсальних рішень.",
  },
  {
    number: "03",
    title: "Догляд та консультація",
    description: "Чесно оцінюємо стан волосся та складаємо план, який працює вдома і в студії.",
  },
] as const;

export const portfolioImages = [
  {
    src: "/images/landing/portfolio-brunette-v1.png",
    alt: "Глибокий брюнет із м’яким винним відблиском після фарбування",
  },
  {
    src: "/images/landing/portfolio-copper-v1.png",
    alt: "Мідний відтінок волосся після професійного фарбування",
  },
  {
    src: "/images/landing/portfolio-blonde-v1.png",
    alt: "Бежевий блонд із м’якою розтяжкою кореня після фарбування",
  },
] as const;
~~~

- [ ] **Step 2: Typecheck the isolated addition.**

Run:

~~~powershell
npm run typecheck
~~~

Expected: exit code 0.

### Task 3: Add a dark shared-header variant

**Files:**
- Modify: src/components/site-header.tsx:1-72

- [ ] **Step 1: Add a limited variant API.**

~~~tsx
type SiteHeaderProps = {
  variant?: "light" | "dark";
};

export function SiteHeader({ variant = "light" }: SiteHeaderProps) {
  const isDark = variant === "dark";
  const navClass = isDark
    ? "text-sm font-semibold text-white/72 transition hover:text-white"
    : "text-sm font-semibold text-muted-foreground transition hover:text-ink";

  // Retain the existing Link, Sheet, and navigation structure.
}
~~~

- [ ] **Step 2: Apply dark classes only when requested.**

Use transparent dark header background, white logo/nav, white outline desktop booking action, and white ghost mobile trigger for dark mode. Retain the existing light default for services, booking, success, and admin pages. Keep the mobile Sheet surface light and readable regardless of variant.

- [ ] **Step 3: Verify header call sites.**

Run:

~~~powershell
rg -n "<SiteHeader" src/app
~~~

Expected: only src/app/page.tsx uses variant="dark".

### Task 4: Implement the service-first landing page

**Files:**
- Modify: src/app/page.tsx:1-136

- [ ] **Step 1: Replace imports and static placeholder array.**

~~~tsx
import { ArrowDownRight, ArrowUpRight, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { landingServices, portfolioImages } from "@/components/landing/content";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
~~~

- [ ] **Step 2: Replace the page body with the approved semantic sequence.**

~~~tsx
<>
  <div className="landing-shell">
    <SiteHeader variant="dark" />
    <main>
      <section className="landing-hero" />
      <section id="services" className="landing-services" />
      <section id="about" className="landing-approach" />
      <section className="landing-portfolio" />
      <section className="landing-booking" />
      <section id="contacts" className="landing-contacts" />
    </main>
  </div>
  <SiteFooter />
</>
~~~

The hero must contain this exact visible copy and direct booking Link:

~~~tsx
<h1 className="landing-display">КОЛІР, ЩО ВІДЧУВАЄТЬСЯ.</h1>
<p className="landing-service-line">ФАРБУВАННЯ · КЕРАТИН · БОТОКС</p>
<Link href="/booking" className="landing-booking-button">
  Записатися онлайн <ArrowUpRight size={18} aria-hidden="true" />
</Link>
~~~

Use Image with fill, sizes, stable positioned wrappers, and descriptive alt values for all five generated assets. Render services from landingServices and portfolio from portfolioImages. Do not add price cards, product catalog content, product copy, a map, placeholder gradients, or unverified contact/social links.

- [ ] **Step 3: Verify primary links.**

Run:

~~~powershell
rg -n 'href="/(booking|services)"' src/app/page.tsx
~~~

Expected: hero, consultation, and final CTA targets are /booking; service discovery targets are /services.

### Task 5: Add scoped landing styles and remove placeholder rendering

**Files:**
- Modify: src/app/globals.css:89-120

- [ ] **Step 1: Append global landing primitives without changing form controls.**

~~~css
.landing-shell { background: #090606; color: #fff; overflow: clip; }
.landing-display { font-family: var(--font-manrope), sans-serif; font-size: clamp(3.1rem, 15vw, 8.2rem); font-weight: 700; letter-spacing: -.07em; line-height: .86; }
.landing-service-line { font-size: .72rem; font-weight: 700; letter-spacing: .13em; line-height: 1.4; }
.landing-booking-button { display: inline-flex; min-height: 3.5rem; align-items: center; justify-content: center; gap: .6rem; border-radius: 999px; background: #fff; color: #090606; padding: .85rem 1.25rem; font-size: .875rem; font-weight: 800; transition: transform .2s ease, background .2s ease; }
.landing-booking-button:hover { background: #f4f1f1; transform: translateY(-2px); }
@media (prefers-reduced-motion: reduce) { .landing-booking-button { transition: none; } }
~~~

- [ ] **Step 2: Add section-specific styles.**

Implement 16px mobile gutters; dark wine/black hero and booking bands; true-white service/contact surfaces; one-column mobile order; and a desktop two-column hero only from 1024px. The gallery stacks on mobile, then becomes an asymmetric grid from the md breakpoint. No horizontal overflow and no image placeholder class may remain in home page rendering.

- [ ] **Step 3: Verify placeholder removal.**

Run:

~~~powershell
rg -n "image-placeholder" src
~~~

Expected: no matches.

### Task 6: Update the design record and verify the build

**Files:**
- Modify: docs/superpowers/specs/2026-06-22-service-first-dark-editorial-landing-design.md

- [ ] **Step 1: Append the final asset inventory.**

~~~md
## Final assets

- public/images/landing/hero-colourist-v1.png
- public/images/landing/studio-colour-work-v1.png
- public/images/landing/portfolio-brunette-v1.png
- public/images/landing/portfolio-copper-v1.png
- public/images/landing/portfolio-blonde-v1.png
~~~

- [ ] **Step 2: Run non-interactive validation.**

Run:

~~~powershell
npm run typecheck
npm run lint
npm run build
~~~

Expected: every command exits 0.

- [ ] **Step 3: Perform visual and interaction validation.**

Inspect the final generated assets and the accepted hero concept with view_image. If a user-selected browser or existing preview URL is available, check the home page at mobile and desktop widths, open the mobile navigation, and follow /booking and /services. If a browser target is unavailable, record browser verification as manual work remaining; do not claim it ran.

- [ ] **Step 4: Inspect the final diff.**

Run:

~~~powershell
git diff --check
git status --short
~~~

Expected: no whitespace errors and only the files declared in this plan plus generated assets.
