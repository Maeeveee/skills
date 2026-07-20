# postcss-px-viewport

Gunakan teknik postcss-px-to-viewport untuk membuat desain UI menjadi pixel-perfect dan proporsional di semua layar desktop. Secara otomatis mengonversi statis px menjadi vw (viewport width) saat build-time.

## What it does

Mengonversi seluruh nilai `px` di output CSS (termasuk Tailwind utility classes) menjadi unit `vw` pada saat kompilasi. Developer bisa copy-paste angka `px` langsung dari Figma tanpa konversi manual, dan layout akan menyusut serempak secara proporsional di semua resolusi desktop.

- **Framer Motion / GSAP aman**: Tidak merusak animasi karena menggunakan unit CSS native (`vw`), bukan manipulasi DOM via JavaScript.
- **`position: fixed` & `sticky` berfungsi native**: Tidak seperti `transform: scale` atau `zoom`, konversi unit tidak merusak CSS positioning.
- **Zero-Runtime**: Konversi terjadi saat build-time (kompilasi CSS). Tidak ada hook JavaScript, tidak ada event listener `resize`, tidak ada re-render React.
- **SEO & Aksesibilitas friendly**: Teks mengikuti reflow natural CSS, bukan dipaksa menyusut oleh `zoom` atau `transform`.

## How to invoke

Invoke skill ini saat membangun UI pixel-perfect proporsional dari hand-off Figma beresolusi tetap (misal 1920x1080) untuk proyek Next.js, Nuxt, atau Vite yang menggunakan Tailwind CSS.

Trigger words/phrases dari user:
- "biar gak pecah di laptop"
- "scaling otomatis"
- "pixel perfect di semua resolusi"
- "postcss viewport"
- "konversi px ke vw otomatis"
- "responsive tanpa media query"
- "copy paste dari Figma langsung responsif"

Invoke juga saat user melaporkan bug terkait teknik ini: ukuran font tidak proporsional, elemen membesar tak terbatas di ultrawide, spacing meleset, atau inline styles tidak ikut menyusut.

## Example usage

1. Install plugin:
   ```bash
   yarn add -D postcss-px-to-viewport-8-plugin
   ```

2. Tambahkan ke `postcss.config.js` (setelah `tailwindcss`):
   ```javascript
   export default {
     plugins: {
       'tailwindcss': {},
       'autoprefixer': {},
       'postcss-px-to-viewport-8-plugin': {
         unitToConvert: 'px',
         viewportWidth: 1920,
         unitPrecision: 5,
         propList: ['*', '!border*'],
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

3. Slicing langsung dari Figma (arbitrary values di `lg:`, class bawaan untuk default):
   ```html
   <div class="w-full p-4 text-base lg:w-[500px] lg:h-[300px] lg:text-[24px] lg:mt-[50px] lg:p-[20px]">
     Konten pixel-perfect
   </div>
   ```

## See also

- [`SKILL.md`](./SKILL.md) — full LLM-facing instructions, aturan wajib, gotchas, dan testing checklist
