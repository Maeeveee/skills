---
name: postcss-px-viewport
description: 'Use the postcss-px-to-viewport technique to make UI designs pixel-perfect and proportional across all desktop screens. Automatically converts static px to vw (viewport width) at build-time. Use this skill if the target is a pixel-perfect UI that is safe for SEO, Accessibility, does not break position: fixed, and supports animation libraries like Framer Motion.'
---

# PostCSS Px-to-Viewport Scaling

This technique uses a PostCSS plugin to convert all `px` usage in **generated CSS files** (including Tailwind output) to browser screen relative percentages `vw` (Viewport Width) at build-time. Developers can copy-paste `px` numbers directly from Figma, and the entire UI will shrink proportionally across all desktop resolutions without additional JavaScript.

## Advantages over CSS Zoom / Transform Scale

1. **Animation Compatibility (Framer Motion / GSAP Safe)**: The final result uses native CSS units (`vw`), allowing Framer Motion to read dimension sizes and bounding boxes accurately. No animations will jitter, jump, or miss their positions.
2. **Does Not Break Layouts**: Unlike `transform: scale` or `zoom`, `vw` unit conversion does not break the natural CSS layout flow. `position: fixed` and `position: sticky` work exactly as they should without needing `createPortal` tricks.
3. **Better Performance (Zero-Runtime)**: Conversion is done during the *build-time* phase (CSS compilation), not relying on JavaScript execution tracking `resize` event listeners in the browser. No hooks, no React re-renders.
4. **Cross-Framework Support**: Works perfectly in Next.js (Pages/App Router), Nuxt, Vite, and other build tools that utilize PostCSS.
5. **Universal Browser Compatibility**: The `vw` unit is supported by 100% of modern browsers including Firefox, Safari, and mobile browsers, without compatibility issues like CSS `zoom` which was only supported by Firefox since version 126.

## When to Use This Technique?

Use this technique when you receive a Figma *hand-off* with a *fixed* resolution (e.g., 1920x1080) and the client wants the website result to be exactly 1:1 identical from ultra-wide screens down to small laptop screens (1366 / 1280), **and** you desperately need animation reliability (Framer Motion / GSAP) as well as SEO and accessibility safety.

### Trigger Words / Phrases from User

Invoke this skill when the user mentions:
- "don't let it break on laptop"
- "automatic scaling"
- "pixel perfect on all resolutions"
- "postcss viewport"
- "auto convert px to vw"
- "responsive without media queries"
- "copy paste from Figma responsive instantly"

Also invoke when the user reports bugs in a project already using this technique: font size too small/large at certain resolutions, elements clipped on ultrawide screens, or unproportional spacing.

## When NOT to Use This Technique

1. **Project uses Tailwind v4 WITHOUT `@tailwindcss/postcss`**: Tailwind v4 by default no longer runs as a PostCSS plugin. If you do not install `@tailwindcss/postcss`, the px-to-viewport plugin will never process Tailwind's output.
2. **Components relying on dynamic inline styles**: If the project uses a lot of `style={{ width: '300px' }}` or third-party libraries generating inline styles at runtime, PostCSS **will not convert** those values because PostCSS only processes `.css` files during compilation.
3. **Layouts requiring fixed absolute sizes**: If there are elements whose size MUST remain the same across all resolutions (e.g., a 24px icon that shouldn't shrink, 1px borders), you must exclude those elements using `selectorBlackList` or `propList`.
4. **Pure mobile-first projects**: This plugin is designed to shrink desktop layouts. If your project is purely mobile-first, this technique is overkill and can cause font sizes to become too small on mobile screens.

## Critical Prerequisites: How This Plugin Works with Tailwind

> **IMPORTANT**: This plugin DOES NOT read your HTML/JSX classes directly. The workflow is:
>
> 1. **Tailwind CSS** generates CSS files from the classes you use (e.g., `w-[500px]` → CSS `.w-\[500px\] { width: 500px; }`)
> 2. **PostCSS px-to-viewport** scans the CSS output and converts `500px` → `26.04167vw`
> 3. The browser reads the final result as `vw` units
>
> Therefore, Tailwind **MUST** run as a PostCSS plugin (not standalone CLI mode or standalone Vite plugin) so its CSS output enters the PostCSS pipeline and can be processed by the px-to-viewport plugin.

## Implementation Steps

### 1. Installation

Use the *forked* version of the plugin that is compatible with PostCSS 8:
```bash
npm install -D postcss-px-to-viewport-8-plugin
# or
yarn add -D postcss-px-to-viewport-8-plugin
# or
pnpm add -D postcss-px-to-viewport-8-plugin
```

### 2. Environment Confirmation (Turbopack vs Webpack)

**INSTRUCTIONS FOR AI**: When you (AI) are asked to initialize this skill for the first time in a Next.js project, you **MUST** offer the user a choice first:
> "Do you want to keep using **Turbopack** or switch to **Webpack**?
> - **Turbopack**: Very fast hot-reload, but sometimes the px-to-viewport scaling preview only works perfectly after building (`npm run build`).
> - **Webpack** (Default Next.js without `--turbo`): Scaling preview is instantly perfect during development (`npm run dev`), but hot-reload and build processes will feel slower."

Wait for the user's answer before proceeding with the configuration.
**ACTION AFTER USER'S ANSWER:**
- **If the user chooses Webpack**: Check the `package.json` file. Modify the `"dev"` script to run using Webpack (by removing the `--turbo` flag if it exists, so it becomes `"next dev"`).
- **If the user chooses Turbopack**: Leave the `package.json` file as is without modifying it.

### 3. PostCSS Configuration

Modify the `postcss.config.js` (or `postcss.config.mjs`) file in your project root. Ensure there is **only one `postcss-px-to-viewport-8-plugin` configuration** to avoid redundancy and overlapping.

**Plugin order is CRITICAL**: The Tailwind plugin must be at the top (run first), then `postcss-px-to-viewport-8-plugin` below it.

```javascript
// postcss.config.js or postcss.config.mjs
export default {
  plugins: {
    // 1. Use 'tailwindcss'
    'tailwindcss': {},
    'autoprefixer': {}, 
    // 2. Convert px → vw LAST
    'postcss-px-to-viewport-8-plugin': {
      unitToConvert: 'px',
      viewportWidth: 1920,      // <- Figma frame width (MUST ADJUST)
      unitPrecision: 5,         // Number of decimals
      propList: ['*', '!border*'], // Convert all CSS properties EXCEPT border (thickness/radius)
      viewportUnit: 'vw',       // Final result unit
      fontViewportUnit: 'vw',   // Specific unit for fonts
      selectorBlackList: [],    // CSS classes that are NOT converted (e.g., ['ignore-'])
      minPixelValue: 1,         // Do not convert 1px (thin borders stay 1px)
      mediaQuery: true,         // MUST BE TRUE for Tailwind v4 (to process @layer). Also safe for v3.
      replace: true,
      landscape: false
    }
  }
}
```

### 4. Development Workflow

After configuring PostCSS, you must **restart the development server** (`Ctrl+C` → rerun `npm run dev`).

Next, directly slice the UI following the px sizes stated in Figma. Use arbitrary values **only behind the `lg:` prefix** (see Rule #11) and default Tailwind classes for default/mobile:
```html
<!-- Responsive: default uses built-in classes, lg: uses px from Figma -->
<div class="w-full h-auto text-base mt-6 p-4 gap-4 lg:w-[500px] lg:h-[300px] lg:text-[24px] lg:mt-[50px] lg:p-[20px] lg:gap-[16px]">
  Content Here
</div>
```
> **Note**: If the project **only targets desktop** (no mobile design), you may write without the `lg:` prefix:
> ```html
> <div class="w-[500px] h-[300px] text-[24px] mt-[50px] p-[20px] gap-[16px]">
>   Content Here (Desktop-only project)
> </div>
> ```

The browser will read them as `vw` units automatically. On a 1920px screen, `500px` = 26.04vw. On a 1280px screen, 26.04vw = ~333px. Proportions remain identical.

## Strict Rules

1. **PostCSS Plugin Order MUST be Correct.** `tailwindcss` (or `@tailwindcss/postcss` for v4) MUST be placed before `postcss-px-to-viewport-8-plugin`. If reversed, the plugin will not find Tailwind's CSS output to convert — resulting in a complete conversion failure.

2. **DO NOT Use Inline Styles with `px` Values for Layouts.** PostCSS only processes `.css` files during compilation. Code like `style={{ width: '300px' }}` in React/Vue will NOT be converted to `vw`. If you need dynamic sizes, calculate manually using a helper:
   ```typescript
   // helpers/viewport.ts
   const DESIGN_WIDTH = 1920
   export const pxToVw = (px: number) => `${(px / DESIGN_WIDTH) * 100}vw`
   
   // Usage in components:
   <div style={{ width: pxToVw(300) }}>...</div>
   ```

3. **Use `selectorBlackList` for Elements That Must Not Shrink.** If there are elements whose size must remain absolute on all screens (e.g., small icons, borders, separators), add a special class prefix (e.g., `ignore-`) and include it in `selectorBlackList`:
   ```javascript
   selectorBlackList: ['ignore-']
   ```
   Then in HTML:
   ```html
   <div class="ignore-icon w-[24px] h-[24px]">...</div>  <!-- Stays 24px, not converted -->
   ```

4. **Beware of Sub-Pixel Rounding.** The px → vw conversion results in decimal numbers (e.g., `300px` → `15.625vw`). Browsers calculate sub-pixels differently. In layouts with heavily nested elements (nested grids/flex), this rounding can **accumulate** and create 1-2px gaps. For high-precision areas (like grid cards), consider using `gap` instead of margins, and avoid relying on strict percentage calculations between sibling elements.

5. **Provide a `max-width` Wrapper for Ultrawide Screens.** Because `vw` is linear to screen width, on Ultrawide screens (21:9 / 32:9) all elements will enlarge indefinitely. Ensure there's a wrapper with a maximum limit:
   ```html
   <div class="max-w-[1920px] mx-auto">
     <!-- Entire page content -->
   </div>
   ```
   **NOTE**: Add the `max-w-[1920px]` class to `selectorBlackList` so the `1920px` value is NOT converted to `vw`. Alternatively, use another unit: `max-w-[120rem]`.

6. **Allow External Libraries to be Converted.** By default, we DO NOT USE the `exclude: [/node_modules/]` option so styling from external libraries scales proportionally as well. If an element from a library breaks due to shrinking, isolate it by adding it to `selectorBlackList`. DO NOT exclude the main Tailwind CSS file (e.g., `globals.css`) as it will ruin the entire conversion.

7. **`viewportWidth` MUST Match the Figma Frame Width.** If the designer created frames at 1440px, set `viewportWidth: 1440`. If at 1920px, set `viewportWidth: 1920`. Getting this value wrong will throw off all proportions.

8. **Avoid Using `vh` Units for Height.** This plugin by default only converts `px` to `vw` (width). If you write `h-[1080px]` expecting the height to be proportional to screen height, that will NOT happen — the result will still be `vw` (based on width). For full-height elements, use `h-screen`, `min-h-screen`, `h-full`, or `flex-1`.

9. **`mediaQuery: true` is Mandatory for Tailwind v4.** Tailwind v4 uses Cascade Layers (`@layer`), which are internally considered "Media Queries" by this plugin. If `mediaQuery` is left `false` (default), the plugin will ignore all CSS classes from Tailwind. This rule is highly critical for the UI to scale properly in v4.

10. **Exclude Border Properties (Thickness and Radius).** Do not convert properties related to `border` (such as `border-width`, `border-radius`, etc.) as it will make the styling messy when scaled (e.g., borders becoming too thin/disappearing, or curves losing proportion). Ensure the `propList` option is set to exclude them:
    ```javascript
    propList: ['*', '!border*']
    ```

11. **Arbitrary Values (`[...]`) MAY ONLY be Used with the `lg:` Prefix.** Because this plugin converts all `px` values in CSS output to `vw`, using arbitrary values in Tailwind (like `w-[500px]`, `text-[24px]`, `p-[20px]`) is **ONLY allowed** at the `lg:` breakpoint and above (i.e., `lg:`, `xl:`, `2xl:`).

    **The Reason:**
    - Arbitrary `px` values from Figma are meant for desktop layouts (≥1024px), which PostCSS will convert to `vw` to make them proportional.
    - For breakpoints below `lg:` (i.e., default/`sm:`/`md:`), you **MUST use built-in Tailwind utility classes** (like `w-full`, `w-1/2`, `p-4`, `text-base`, `gap-6`, etc.) because at mobile/tablet resolutions, the layout should follow conventional responsive patterns, not proportional scales from desktop Figma.

    **✅ CORRECT Example:**
    ```html
    <!-- Default (mobile) uses built-in classes, lg: uses arbitrary from Figma -->
    <div class="w-full p-4 text-base lg:w-[500px] lg:p-[40px] lg:text-[24px]">
      Responsive content
    </div>

    <!-- Spacing & gap -->
    <div class="gap-4 mt-6 lg:gap-[32px] lg:mt-[60px]">
      ...
    </div>
    ```

    **❌ INCORRECT Example:**
    ```html
    <!-- DO NOT: arbitrary without lg: prefix -->
    <div class="w-[500px] p-[40px] text-[24px]">
      This will be converted to vw on ALL breakpoints, including mobile!
    </div>

    <!-- DO NOT: arbitrary on sm: or md: -->
    <div class="sm:w-[300px] md:p-[20px]">
      Arbitrary on small breakpoints is not necessary
    </div>
    ```

    **Exception**: If the project **only targets desktop** (no mobile/tablet designs from Figma), arbitrary values may be used without the `lg:` prefix because the entire layout is strictly for desktop viewports.

    > **NOTE FOR AI**: When generating or reviewing code, always ensure arbitrary `px` values are behind the `lg:` (or `xl:`/`2xl:`) prefix. If you find arbitrary values without a breakpoint prefix, move them to `lg:` and replace the default version with the most suitable built-in Tailwind class.

## Testing Checklist

Before considering the implementation complete, manually check the following conditions:

- **1920x1080**: The design must be 1:1 identical to Figma. No elements should forcefully enlarge.
- **1366x768 & 1280x720**: The narrowest laptop resolutions. The entire UI must shrink proportionally and consistently. Check if there are any glaring sub-pixel gaps (especially in grids/tables).
- **Ultrawide 2560x1080 (21:9)**: Ensure the `max-width` wrapper prevents the design from enlarging infinitely. Content must be centered.
- **Fixed Navbar/Modal**: Ensure `position: fixed` components work normally and stick to the browser viewport (not trapped inside the wrapper).
- **Sticky Sidebar/Header**: Ensure `position: sticky` works when scrolling.
- **Framer Motion Animations**: Run enter/exit, drag, and layout animations — ensure there are no positional jumps or incorrect sizing.
- **Inline Styles**: Check if any components use inline `px` styles that didn't convert (usually noticeable because their size is disproportionate compared to surrounding elements).
- **Font Readability**: On a 1280px screen, ensure text is still comfortably readable. If too small, consider increasing `font-size` in the original design or using `clamp()` for font properties.
