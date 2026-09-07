# Setup & Configuration Reference — postcss-px-viewport

Companion to SKILL.md. Read this file ONLY when initializing the technique in a project for the first time (or when debugging the conversion pipeline). The per-task Tailwind class rules live in SKILL.md.

## How the Plugin Works with Tailwind

The plugin does NOT read HTML/JSX classes. The pipeline is:

1. **Tailwind** generates CSS from the classes used (e.g., `w-[500px]` → `.w-\[500px\] { width: 500px; }`)
2. **postcss-px-to-viewport** scans that CSS output and converts `500px` → `26.04167vw`
3. The browser renders `vw` units

Therefore Tailwind **MUST run as a PostCSS plugin** (not standalone CLI, not the standalone Vite plugin) so its output enters the PostCSS pipeline.

## Installation

Use the fork compatible with PostCSS 8:

```bash
npm install -D postcss-px-to-viewport-8-plugin
# or: yarn add -D postcss-px-to-viewport-8-plugin
# or: pnpm add -D postcss-px-to-viewport-8-plugin
```

## Turbopack vs Webpack (Next.js only)

**INSTRUCTIONS FOR AI**: When initializing this skill for the first time in a Next.js project, you **MUST** offer the user this choice before configuring anything:

> "Do you want to keep using **Turbopack** or switch to **Webpack**?
> - **Turbopack**: Very fast hot-reload, but the px-to-viewport preview sometimes only works perfectly after `npm run build`.
> - **Webpack** (default Next.js without `--turbo`): Scaling preview is instantly perfect during `npm run dev`, but dev/build feel slower."

**ACTION AFTER USER'S ANSWER:**
- **Webpack**: in `package.json`, remove the `--turbo` flag from the `"dev"` script (so it becomes `"next dev"`).
- **Turbopack**: leave `package.json` unchanged.

## PostCSS Configuration

Modify `postcss.config.js` (or `.mjs`) at the project root. Ensure there is **only one** `postcss-px-to-viewport-8-plugin` entry — duplicates cause overlapping conversions.

**Plugin order is CRITICAL**: the Tailwind plugin must be listed first (run before), `postcss-px-to-viewport-8-plugin` last.

```javascript
// postcss.config.js or postcss.config.mjs
export default {
  plugins: {
    // 1. Tailwind MUST run first. Use the correct key for your version:
    //    - Tailwind v3: 'tailwindcss': {}
    //    - Tailwind v4: '@tailwindcss/postcss': {}
    'tailwindcss': {},
    'autoprefixer': {},
    // 2. Convert px → vw LAST
    'postcss-px-to-viewport-8-plugin': {
      unitToConvert: 'px',
      viewportWidth: 1920,      // <- Figma frame width (MUST ADJUST to match the design)
      unitPrecision: 5,         // Number of decimals
      propList: ['*'],          // Convert ALL properties — incl. border-radius & >=2px border widths (see rule 4)
      viewportUnit: 'vw',       // Final result unit
      fontViewportUnit: 'vw',   // Specific unit for fonts
      selectorBlackList: [],    // Classes that are NOT converted (e.g., ['ignore-'])
      minPixelValue: 1,         // Values <= 1px stay fixed: hairline borders stay crisp 1px (see rule 4)
      mediaQuery: true,         // MUST BE TRUE for Tailwind v4 (processes @layer). Safe for v3.
      replace: true,
      landscape: false
    }
  }
}
```

After configuring, **restart the dev server** (`Ctrl+C` → `npm run dev`).

## Configuration Rules

1. **Plugin order must be correct.** `tailwindcss` (or `@tailwindcss/postcss`) before `postcss-px-to-viewport-8-plugin`. Reversed order = the plugin finds no Tailwind CSS to convert = total conversion failure.

2. **`viewportWidth` must match the Figma frame width.** Frames at 1440 → `viewportWidth: 1440`; frames at 1920 → `viewportWidth: 1920`. Wrong value throws off every proportion.

3. **`mediaQuery: true` is mandatory for Tailwind v4.** v4 uses Cascade Layers (`@layer`), treated internally as media queries by this plugin. Left `false` (the default), the plugin ignores ALL Tailwind CSS.

4. **Border radius must scale; 1px hairlines must not.** NEVER use `!border*` — it freezes `border-radius` in px, so on a 1280px screen the element shrinks to ~67% but the radius doesn't: everything looks *rounder* on laptops (and ≥2px borders look *bolder* by the same mechanism). Instead, combine:
   - `propList: ['*']` — `border-radius` and ≥2px border widths convert to `vw` and stay proportional to the element at every resolution.
   - `minPixelValue: 1` — keeps values ≤ 1px fixed, so hairline borders (Tailwind's `border` class, `1px` separators) stay crisp instead of becoming a blurry `0.052vw` sub-pixel (≈0.67px at 1280).
   - Trade-off: a converted `2px` border renders ~1.33px at 1280px — slightly soft on non-retina displays. If ONE specific border must keep an exact width, isolate that element with an `ignore-` class (rule 7) instead of excluding borders globally.
   - Alternative (ALL border widths must stay crisp, radius still scales): `propList: ['*', '!border', '!border-width', '!border-top-width', '!border-right-width', '!border-bottom-width', '!border-left-width']`.

5. **Cap ultrawide with a `rem`-based wrapper, never `px`.** `vw` is linear to screen width, so on 21:9/32:9 screens everything grows indefinitely:
   ```html
   <div class="max-w-[120rem] mx-auto">
     <!-- Entire page content (120rem = 1920px) -->
   </div>
   ```
   `rem` is never converted, so the cap stays fixed. **Do NOT** write `max-w-[1920px]` and add it to `selectorBlackList` — Tailwind escapes the brackets in the generated selector (`.max-w-\[1920px\]`), so the blacklist entry never matches and the cap silently converts to `100vw` (useless).
   **Known limitation**: `vw` is relative to the *viewport*, not the wrapper. The cap stops fluid (`w-full`) sections and page backgrounds from stretching, but fixed-size `vw` elements keep growing past it on ultrawide. A hard 1:1 ultrawide freeze requires a JavaScript virtual-canvas technique (CSS `zoom`/`transform: scale` wrapper), which is outside this skill's scope.

6. **Do not exclude `node_modules`.** By default, external library CSS also converts so third-party components scale with the page. If a specific library element breaks, isolate it via `selectorBlackList` — never `exclude: [/node_modules/]`, and never exclude the main Tailwind CSS file (e.g., `globals.css`).

7. **`selectorBlackList` for non-shrinking elements.** For elements that must keep an absolute size on every screen (small icons, separators), register a prefix and use it:
   ```javascript
   selectorBlackList: ['ignore-']
   ```
   ```html
   <div class="ignore-icon w-[24px] h-[24px]">...</div>  <!-- Stays 24px, never converted -->
   ```

8. **Dynamic inline styles need a manual helper.** PostCSS never touches inline styles:
   ```typescript
   // helpers/viewport.ts
   const DESIGN_WIDTH = 1920
   export const pxToVw = (px: number) => `${(px / DESIGN_WIDTH) * 100}vw`

   // Usage in components:
   <div style={{ width: pxToVw(300) }}>...</div>
   ```

9. **Beware sub-pixel rounding.** px → vw produces decimals (e.g., `300px` → `15.625vw`) and browsers round sub-pixels differently. In deeply nested grid/flex layouts the error accumulates into 1-2px gaps. Prefer `gap` over margins in high-precision areas, and avoid strict percentage sums between siblings.

10. **`vh` is never produced.** The plugin converts px → `vw` (width-based) only. `h-[1080px]` becomes width-relative `vw`, NOT height-relative. For full-height elements use `h-screen`, `min-h-screen`, `h-full`, or `flex-1`.

## Testing Checklist

Before considering implementation complete:

- **Class audit**: run the Self-Check greps in SKILL.md — every hit must be fixed or explicitly justified.
- **1920x1080**: design must be 1:1 identical to Figma; no element forcefully enlarged.
- **1366x768 & 1280x720**: UI shrinks proportionally and consistently; check for sub-pixel gaps in grids/tables. Spacing that did NOT shrink = frozen `rem` class (`lg:gap-6`) → convert to arbitrary px.
- **Border radius & borders at 1280**: radius must look proportionally the same as at 1920 (not rounder); ≥2px borders must shrink with the layout (not look bolder); 1px hairlines must stay crisp (not blurry).
- **Ultrawide 2560x1080 (21:9)**: the `max-w-[120rem]` wrapper keeps the page bounded and centered.
- **Fixed Navbar/Modal**: `position: fixed` sticks to the browser viewport (not trapped inside the wrapper).
- **Sticky Sidebar/Header**: `position: sticky` works while scrolling.
- **Framer Motion**: run enter/exit, drag, and layout animations — no positional jumps or wrong sizing.
- **Inline styles**: scan for inline `px` styles that didn't convert (visible as elements disproportionate to their surroundings).
- **Font readability**: on a 1280px screen text must stay comfortably readable; if too small, increase the source `font-size` or use `clamp()` for font properties.
