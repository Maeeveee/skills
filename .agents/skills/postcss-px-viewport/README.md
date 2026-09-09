# postcss-px-viewport

Use the postcss-px-to-viewport technique to make UI designs pixel-perfect and proportional across all desktop screens. Automatically converts static px to vw (viewport width) at build-time.

## What it does

Converts all `px` values in CSS output (including Tailwind utility classes) to `vw` units during compilation. Developers can copy-paste `px` numbers directly from Figma without manual conversion, and the layout will shrink proportionally across all desktop resolutions simultaneously.

- **Framer Motion / GSAP safe**: Does not break animations because it uses native CSS units (`vw`), not DOM manipulation via JavaScript.
- **`position: fixed` & `sticky` work natively**: Unlike `transform: scale` or `zoom`, unit conversion does not break CSS positioning.
- **Zero-Runtime**: Conversion happens at build-time (CSS compilation). No JavaScript hooks, no `resize` event listeners, no React re-renders.
- **SEO & Accessibility friendly**: Text follows natural CSS reflow, not forced to shrink by `zoom` or `transform`.

## How to invoke

Invoke this skill when building a pixel-perfect proportional UI from a fixed-resolution Figma hand-off (e.g., 1920x1080) for Next.js, Nuxt, or Vite projects using Tailwind CSS.

Trigger words/phrases from the user:
- "don't let it break on laptop"
- "automatic scaling"
- "pixel perfect on all resolutions"
- "postcss viewport"
- "auto convert px to vw"
- "responsive without media queries"
- "copy paste from Figma responsive instantly"

Also invoke when the user reports bugs related to this technique: font size out of proportion, elements expanding indefinitely on ultrawide, spacing off, or inline styles not shrinking.

## Example usage

1. Install plugin:
   ```bash
   yarn add -D postcss-px-to-viewport-8-plugin
   ```

2. Add to `postcss.config.js` (after `tailwindcss`):
   ```javascript
   export default {
     plugins: {
       // Tailwind v3: 'tailwindcss': {}  |  Tailwind v4: '@tailwindcss/postcss': {}
       'tailwindcss': {},
       'autoprefixer': {},
       'postcss-px-to-viewport-8-plugin': {
         unitToConvert: 'px',
         viewportWidth: 1920,
         unitPrecision: 5,
         propList: ['*'],
         viewportUnit: 'vw',
         fontViewportUnit: 'vw',
         selectorBlackList: [],
         minPixelValue: 1,
         mediaQuery: true,
         replace: true,
         landscape: false
       }
     }
   }
   ```

3. Slicing directly from Figma:
   - **Tailwind**: arbitrary values at `lg:`, default classes for mobile:
     ```html
     <div class="w-full p-4 text-base lg:w-[500px] lg:h-[300px] lg:text-[24px] lg:mt-[50px] lg:p-[20px]">
       Pixel-perfect content
     </div>
     ```
   - **SCSS / CSS Modules (Desktop-First)**: set `mediaQuery: false`, write desktop styles at root, tablet/mobile inside `@media`:
     ```scss
     .card {
       width: 500px; padding: 32px; // Desktop -> converts to vw
       @media (max-width: 1024px) { width: 100%; padding: 16px; } // Tablet -> stays static px
     }
     ```

## See also

- [`SKILL.md`](./SKILL.md) — per-task Tailwind class rules (arbitrary px at `lg:`, built-in classes below), self-check greps, and quick-debug guide
- [`setup.md`](./setup.md) — one-time initialization: install, Turbopack/Webpack notes, full PostCSS config, and the testing checklist
