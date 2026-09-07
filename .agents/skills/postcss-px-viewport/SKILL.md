---
name: postcss-px-viewport
description: 'Use the postcss-px-to-viewport technique to make UI designs pixel-perfect and proportional across all desktop screens. Automatically converts static px to vw (viewport width) at build-time. Use this skill if the target is a pixel-perfect UI that is safe for SEO, Accessibility, does not break position: fixed, and supports animation libraries like Framer Motion.'
---

# PostCSS Px-to-Viewport Scaling

A PostCSS plugin converts every `px` in the compiled CSS (including Tailwind output) to `vw` at build-time. You copy px values straight from Figma; the whole UI shrinks proportionally across desktop resolutions (1920 → 1366 → 1280) with zero runtime JS, native `position: fixed`/`sticky` behavior, and Framer Motion / GSAP animation safety.

> **First task in a project?** Check whether `postcss.config.js` already contains `postcss-px-to-viewport-8-plugin`. If not, read [SETUP.md](setup.md) in this skill's directory and complete initialization before writing any UI. Everything below is required on EVERY component task.

## When NOT to Use This Technique

1. **Tailwind v4 without `@tailwindcss/postcss`** — the plugin never sees Tailwind's output; nothing converts.
2. **Heavy dynamic inline styles** (`style={{ width: '300px' }}`) or runtime-generated styles — PostCSS only processes `.css` files at compile time.
3. **Elements that must never shrink** (fixed-size icons, 1px separators) — exclude them via `selectorBlackList` (see SETUP.md).
4. **Pure mobile-first projects** — this technique shrinks desktop layouts; on mobile it makes fonts too small.

If the client demands a *hard* 1:1 freeze on ultrawide screens, `vw` cannot provide it — use the `tailwind-scaling` (zoom canvas) skill instead.

## MANDATORY: How to Write Tailwind Classes

> **IMPORTANT FOR AI**: This is the #1 section agents get wrong. Read it fully before writing any `className`, and run the Self-Check greps at the end of this section before considering any component task complete.

The plugin converts `px` in the compiled CSS to `vw`. Two facts follow from this, and together they dictate every class you write:

1. **Built-in scale classes resolve to `rem`, NOT `px`** (`gap-6` → `1.5rem`, `p-4` → `1rem`, `text-base` → `1rem`, `w-96` → `24rem`). The plugin never converts `rem`, so these values stay **frozen** while everything around them shrinks → broken proportions on 1280/1366 laptops.
2. **Arbitrary px classes resolve to `px`** (`gap-[32px]` → `32px`). The plugin converts them to `vw`, so they scale at **every breakpoint where they apply** — including mobile.

### Rule A — Desktop Layer (`lg:`, `xl:`, `2xl:`)

Every spacing, sizing, and typography value **MUST be an arbitrary px value**:

```html
<!-- ✅ CORRECT: arbitrary px from Figma -->
<div class="lg:gap-[32px] lg:p-[40px] lg:mt-[50px] lg:w-[500px] lg:h-[300px] lg:text-[24px] lg:leading-[32px]">

<!-- ❌ FORBIDDEN: built-in numeric scale at lg+ (frozen rem, silently breaks scaling) -->
<div class="lg:gap-6 lg:p-4 lg:mt-2 lg:w-96 lg:h-64 lg:text-base lg:leading-6">
```

`lg:gap-6` looks like idiomatic Tailwind, but in this technique it is a **silent bug**: the value never scales while its siblings do.

This applies **even to values not written in Figma**. If you must invent a spacing, still write it as arbitrary px (`lg:gap-[24px]`) so it scales with its siblings — never `lg:gap-6`.

### Rule B — Mobile Layer (base, `sm:`, `md:`)

Every value **MUST use built-in Tailwind classes** (`w-full`, `p-4`, `text-base`, `gap-4`, `mt-6`):

```html
<!-- ✅ CORRECT: built-in classes for the mobile layer -->
<div class="w-full h-auto text-base mt-6 p-4 gap-4">

<!-- ❌ FORBIDDEN: bare arbitrary px leaking desktop proportions into mobile -->
<div class="p-[20px] gap-[16px] text-[14px] sm:w-[300px] md:p-[24px]">
```

### Decision Table

| Utility group | Mobile layer (base / `sm:` / `md:`) | Desktop layer (`lg:`+ / unprefixed desktop-only) |
|---|---|---|
| Spacing: `gap`, `gap-x`, `gap-y`, `p*`, `m*`, `space-*` | `gap-4`, `p-4`, `mt-6` | `lg:gap-[32px]`, `lg:p-[40px]`, `lg:mt-[50px]` — **NEVER** `lg:gap-6`, `lg:p-4` |
| Sizing: `w`, `h`, `min-*`, `max-*`, `inset*`, `top/right/bottom/left` | `w-full`, `max-w-md`, `h-auto` | `lg:w-[500px]`, `lg:h-[300px]`, `lg:max-h-[560px]` |
| Typography size: `text` size, `leading`, `tracking` | `text-base`, `text-sm`, `leading-6` | `lg:text-[24px]`, `lg:leading-[32px]`, `lg:tracking-[0.5px]` |
| No-px utilities: colors, `font-weight`, alignment, `flex`/`grid` structure, `z-*`, `opacity`, shadows | built-in classes | built-in classes (`lg:text-red-500`, `lg:grid-cols-3`, `lg:font-bold` are fine — no px to scale) |
| Relative built-ins: `w-full`, `w-1/2`, `flex-1`, `h-auto`, `h-screen` | allowed | allowed at `lg:` too (relative units scale with their parent) |
| Border width / radius | built-in (`border`, `rounded-lg`) | arbitrary px from Figma (`lg:rounded-[16px]`, `lg:border-[2px]`) — radius and ≥2px widths convert to `vw` and stay proportional; 1px hairlines stay fixed & crisp |

### Full Example (responsive project)

```html
<!-- ✅ CORRECT: mobile layer uses built-in classes, desktop layer uses arbitrary px -->
<div class="w-full h-auto text-base mt-6 p-4 gap-4 lg:w-[500px] lg:h-[300px] lg:text-[24px] lg:mt-[50px] lg:p-[20px] lg:gap-[16px]">
  Content Here
</div>

<!-- ❌ INCORRECT: built-in numeric scale at lg+ -->
<div class="gap-4 p-4 text-base lg:gap-6 lg:p-6 lg:text-lg">...</div>

<!-- ❌ INCORRECT: arbitrary px without breakpoint prefix -->
<div class="w-[500px] p-[40px] text-[24px]">...</div>
```

### Desktop-Only Projects

If the project targets desktop only (no mobile/tablet design — confirm this with the user once at project start), the desktop layer is the **unprefixed** layer:

- ALL Figma values are written as bare arbitrary px: `gap-[32px]`, `p-[40px]`, `text-[24px]`, `w-[500px]`.
- Built-in numeric scale classes (`gap-6`, `p-4`, `text-base`, `w-96`) are **forbidden anywhere** — same frozen-`rem` problem as Rule A.
- Relative built-ins (`w-full`, `flex-1`, `h-screen`) are still fine.

### Self-Check Before Finishing (MANDATORY for AI)

After writing or editing components, run the matching command from the project root and fix every real hit. Ignore false positives where the class only applies at `lg:`+ regardless of variant order (e.g. `lg:dark:p-[40px]`, `lg:hover:p-[20px]`):

```bash
# (1) Responsive project: built-in numeric scale at lg+ → replace with arbitrary px from Figma
rg -nP "(?<![\w-])(lg|xl|2xl):(gap|gap-x|gap-y|space-x|space-y|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|min-w|min-h|max-w|h|size|basis|top|right|bottom|left|inset|leading|tracking)-(?![0-9]+/)[0-9]|(?<![\w-])(lg|xl|2xl):text-(xs|sm|base|lg|xl|[0-9]+xl)" -g "*.{tsx,jsx,ts,js,html,vue}"

# (2) Responsive project: arbitrary px outside the desktop layer → replace with the closest built-in class, or move it behind lg:
rg -nP "(?<![\w-])(?<!lg:)(?<!xl:)(?<!2xl:)(gap|gap-x|gap-y|space-x|space-y|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|h|min-w|min-h|max-w|size|basis|text|leading|tracking|top|right|bottom|left|inset)-\[[0-9.]+px\]" -g "*.{tsx,jsx,ts,js,html,vue}"

# (3) Desktop-only project: built-in numeric scale anywhere (any variant/prefix) → replace with arbitrary px
rg -nP "(?<![\w-])(gap|gap-x|gap-y|space-x|space-y|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|min-w|min-h|max-w|h|size|basis|top|right|bottom|left|inset|leading|tracking)-(?![0-9]+/)[0-9]|(?<![\w-])text-(xs|sm|base|lg|xl|[0-9]+xl)" -g "*.{tsx,jsx,ts,js,html,vue}"
```

**How to fix hits:**
- Built-in numeric scale at the desktop layer → look up the exact px value in Figma (or infer a sensible px value) and write it as arbitrary (`lg:gap-6` → `lg:gap-[24px]`).
- Bare arbitrary px in a responsive project → move it behind `lg:` and give the base layer the closest built-in class (`p-[20px]` → `p-4 lg:p-[20px]`).

## Per-Task Rules

1. **No inline `px` styles for layout.** `style={{ width: '300px' }}` is never converted — PostCSS only processes `.css` files. Dynamic sizes: use the `pxToVw` helper (SETUP.md).
2. **Full-height elements**: use `h-screen`, `min-h-screen`, `h-full`, or `flex-1`. Never `h-[1080px]` — it converts to width-based `vw`, not height.
3. **Non-shrinking elements** (icons, separators): give them an `ignore-` class prefix and make sure `ignore-` is in `selectorBlackList` (SETUP.md).
4. **High-precision grids**: prefer `gap` over margins — sub-pixel rounding accumulates in deeply nested layouts (details in SETUP.md).

## Quick Debug

- Spacing/typography that does NOT shrink on a 1280px laptop → frozen `rem` class (`lg:gap-6`, `lg:text-base`) → replace with arbitrary px.
- One element wildly mis-sized vs its siblings → unconverted inline `px` style.
- Radius looks ROUNDER on smaller screens → radius is frozen in px (`!border*` in `propList`) → remove the exclusion so `border-radius` converts to `vw` (setup.md rule 4).
- Borders look BOLDER on smaller screens → border-width frozen while content shrinks → let ≥2px widths convert (`propList: ['*']`), keep 1px hairlines protected via `minPixelValue: 1` (setup.md rule 4).
