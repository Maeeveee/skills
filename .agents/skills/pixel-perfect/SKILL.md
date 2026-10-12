---
name: pixel-perfect
description: 'Use the postcss-px-to-viewport technique to make UI designs pixel-perfect and proportional across all desktop screens. Automatically converts static px to vw (viewport width) at build-time. Use this skill if the target is a pixel-perfect UI that is safe for SEO, Accessibility, does not break position: fixed, and supports animation libraries like Framer Motion.'
---

# PostCSS Px-to-Viewport Scaling

A PostCSS plugin converts every `px` in the compiled CSS (including Tailwind output) to `vw` at build-time. You copy px values straight from Figma; the whole UI shrinks proportionally across desktop resolutions (1920 → 1366 → 1280) with zero runtime JS, native `position: fixed`/`sticky` behavior, and Framer Motion / GSAP animation safety.

> **First task in a project?** Check whether `postcss.config.{js,mjs,cjs,ts}`, `vite.config.*`, or `nuxt.config.*` already contains `postcss-px-to-viewport-8-plugin`. If not, read [setup.md](setup.md) and complete initialization before writing any UI.

## When NOT to Use This Technique

1. **Tailwind v4 without `@tailwindcss/postcss`** — the plugin never sees Tailwind's output; nothing converts.
2. **Heavy dynamic inline styles** (`style={{ width: '300px' }}`) or runtime-generated styles — PostCSS only processes `.css` files at compile time.
3. **Elements that must never shrink** (fixed-size icons, 1px separators) — exclude them via `selectorBlackList` (see [setup.md](setup.md)).
4. **Pure mobile-first projects** — this technique shrinks desktop layouts; on mobile it makes fonts too small.

If the client demands a *hard* 1:1 freeze on ultrawide screens, `vw` cannot provide it — that requires a JavaScript virtual-canvas approach (CSS `zoom`/`transform: scale` wrapper locked to the design resolution), which is outside this skill's scope.

## How to Write Tailwind Classes

The plugin converts `px` in compiled CSS to `vw`. Two facts dictate every class you write:

1. **Built-in scale classes resolve to `rem`, NOT `px`** (`gap-6` → `1.5rem`, `p-4` → `1rem`, `text-base` → `1rem`, `w-96` → `24rem`, `rounded-lg` → `0.5rem`). The plugin never converts `rem`, so these values stay **frozen** while everything around them shrinks → broken proportions on 1280/1366 laptops.
2. **Arbitrary px classes resolve to `px`** (`gap-[32px]` → `32px`). The plugin converts them to `vw`, so they scale proportionally at every resolution where they apply.

### Rule A — Desktop Layer (`lg:`, `xl:`, `2xl:`)

Every spacing, sizing, typography, and border-radius value must be an arbitrary px value:

```html
<!-- ✅ Correct: arbitrary px from Figma -->
<div class="lg:gap-[32px] lg:p-[40px] lg:mt-[50px] lg:w-[500px] lg:h-[300px] lg:text-[24px] lg:leading-[32px] lg:rounded-[16px]">

<!-- ❌ Incorrect: built-in numeric scale at lg+ (frozen rem, silently breaks scaling) -->
<div class="lg:gap-6 lg:p-4 lg:mt-2 lg:w-96 lg:h-64 lg:text-base lg:leading-6 lg:rounded-lg">
```

`lg:gap-6` looks like standard Tailwind, but in this technique it is a silent bug: the value never scales while its siblings do. Even if a value is not written in Figma, still write it as arbitrary px (`lg:gap-[24px]`) so it scales with surrounding elements.

**Safe Desktop Exceptions:**
- **Zero values** (`lg:p-0`, `lg:m-0`, `lg:top-0`, `lg:inset-0`, `lg:rounded-none`) render identically across all units (0px == 0rem) and never freeze.
- **Relative built-ins** (`w-full`, `w-1/2`, `flex-1`, `h-screen`, `rounded-full`) scale naturally with their parent container.
- **Non-px utilities** (colors `lg:text-red-500`, layout `lg:grid-cols-3`, font weight `lg:font-bold`) have no px to scale and can use built-in classes.

### Rule B — Mobile Layer (base, `sm:`, `md:`)

Every value must use standard built-in Tailwind classes (`w-full`, `p-4`, `text-base`, `gap-4`, `mt-6`):

```html
<!-- ✅ Correct: built-in classes for the mobile layer -->
<div class="w-full h-auto text-base mt-6 p-4 gap-4">

<!-- ❌ Incorrect: bare arbitrary px leaking desktop proportions into mobile -->
<div class="p-[20px] gap-[16px] text-[14px] sm:w-[300px] md:p-[24px]">
```

**Non-shrinking elements exception:**
Elements intentionally excluded via `selectorBlackList` (e.g. `<div class="ignore-icon w-[24px] h-[24px]">`) are allowed to use arbitrary px on mobile and desktop because the plugin is configured to leave them untouched.

### Decision Table

| Utility group | Mobile layer (base / `sm:` / `md:`) | Desktop layer (`lg:`+ / unprefixed desktop-only) |
|---|---|---|
| Spacing: `gap`, `gap-x`, `gap-y`, `p*`, `m*`, `space-*` | `gap-4`, `p-4`, `mt-6` | `lg:gap-[32px]`, `lg:p-[40px]`, `lg:mt-[50px]` — never `lg:gap-6`, `lg:p-4` |
| Sizing: `w`, `h`, `min-*`, `max-*`, `inset*`, `top/right/bottom/left` | `w-full`, `max-w-md`, `h-auto` | `lg:w-[500px]`, `lg:h-[300px]`, `lg:max-h-[560px]` |
| Typography size: `text` size, `leading`, `tracking` | `text-base`, `text-sm`, `leading-6` | `lg:text-[24px]`, `lg:leading-[32px]`, `lg:tracking-[0.5px]` |
| Border width / radius | built-in (`border`, `rounded-lg`) | arbitrary px (`lg:rounded-[16px]`, `lg:border-[2px]`) — radius scales to `vw`; 1px hairlines stay crisp |
| Zero values: `p-0`, `m-0`, `top-0`, `inset-0`, `rounded-none` | built-in (`p-0`, `inset-0`) | built-in (`lg:p-0`, `lg:inset-0` are safe, 0 never freezes) |
| Relative built-ins: `w-full`, `w-1/2`, `flex-1`, `h-auto`, `h-screen`, `rounded-full` | allowed | allowed at `lg:` too |
| Non-px utilities: colors, font-weight, flex/grid, z-index, opacity | built-in classes | built-in classes (`lg:text-red-500`, `lg:font-bold`) |

### Desktop-Only Projects

If the project targets desktop only (no mobile/tablet design — confirm with user once at project start), the desktop layer is the unprefixed layer:
- All Figma values are written as bare arbitrary px: `gap-[32px]`, `p-[40px]`, `text-[24px]`, `w-[500px]`.
- Built-in numeric scale classes (`gap-6`, `p-4`, `text-base`, `w-96`) are avoided everywhere.

### Self-Check Before Finishing

After writing or editing components, run the validator script to audit classes:

```bash
# Run validator directly from this skill
node .agents/skills/pixel-perfect/scripts/check-viewport-classes.mjs

# Or if copied to project scripts/
node scripts/check-viewport-classes.mjs
```

The validator verifies:
1. No built-in numeric scales or frozen radius classes at desktop breakpoints (`lg:`, `xl:`, `2xl:`).
2. No bare arbitrary px values outside desktop breakpoints (excluding elements with `ignore-` class).
3. Allows 0-values (`lg:p-0`, `lg:inset-0`) and relative classes (`lg:w-full`).

> For automated git pre-commit enforcement, see [husky.md](husky.md) and the [husky skill](../husky/README.md).

## SCSS & CSS Modules Usage (Desktop-First Workflow)

When writing styles in SCSS (`.scss`) or CSS Modules (`.module.scss`):

1. **Configure `mediaQuery: false`**:
   This instructs the plugin to skip all CSS rules wrapped inside `@media` blocks.
2. **Desktop-First Pattern**:
   - **Desktop layer (root)**: Write values straight from Figma as normal `px` (`width: 480px; padding: 32px; font-size: 20px;`). These automatically convert to `vw` at build-time.
   - **Tablet / Mobile layer (`@media`)**: Wrap responsive overrides inside `@media (max-width: 1024px)` or `@media (max-width: 768px)`. With `mediaQuery: false`, **all `px` values inside `@media` remain frozen in static `px`**, preventing mobile layouts and fonts from shrinking unnaturally.

```scss
// Component.module.scss
.heroCard {
  // Desktop: converts to vw (scales smoothly from 1920 to 1280)
  width: 500px;
  padding: 32px;
  font-size: 20px;
  border-radius: 16px;

  // Tablet & Mobile: untouched by PostCSS (stays crisp static px)
  @media (max-width: 1024px) {
    width: 100%;
    padding: 16px;
    font-size: 16px;
    border-radius: 8px;
  }
}
```

## Per-Task Rules

1. **No inline `px` styles for layout.** `style={{ width: '300px' }}` is never converted — PostCSS only processes `.css` files. Dynamic sizes: use the `pxToVw` helper ([setup.md](setup.md)).
2. **Full-height elements**: use `h-screen`, `min-h-screen`, `h-full`, or `flex-1`. Never `h-[1080px]` — it converts to width-based `vw`, not height.
3. **Non-shrinking elements** (icons, separators): give them an `ignore-` class prefix and ensure `ignore-` is registered in `selectorBlackList` ([setup.md](setup.md)).
4. **High-precision grids**: prefer `gap` over margins — sub-pixel rounding accumulates in deeply nested layouts (details in [setup.md](setup.md)).

## Quick Debug

- Spacing/typography that does NOT shrink on a 1280px laptop → frozen `rem` class (`lg:gap-6`, `lg:text-base`) → replace with arbitrary px.
- One element wildly mis-sized vs its siblings → unconverted inline `px` style.
- Radius looks rounder on smaller screens → radius frozen in px (`!border*` in `propList`) → remove exclusion so `border-radius` converts to `vw` (setup.md rule 4).
- Borders look bolder on smaller screens → border-width frozen while content shrinks → let ≥2px widths convert (`propList: ['*']`), keep 1px hairlines protected via `minPixelValue: 1` (setup.md rule 4).
