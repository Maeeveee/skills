---
name: postcss-px-viewport
description: 'Gunakan teknik postcss-px-to-viewport untuk membuat desain UI menjadi pixel-perfect dan proporsional di semua layar desktop. Secara otomatis mengonversi statis px menjadi vw (viewport width) saat build-time. Gunakan skill ini jika targetnya adalah UI pixel-perfect yang aman untuk SEO, Aksesibilitas, tidak merusak position: fixed, dan mendukung library animasi seperti Framer Motion.'
---

# PostCSS Px-to-Viewport Scaling

Teknik ini menggunakan plugin PostCSS untuk mengonversi semua penulisan `px` di **file CSS yang sudah di-generate** (termasuk output Tailwind) menjadi persentase relatif ukuran layar browser `vw` (Viewport Width) saat build-time. Developer bisa copy-paste angka `px` langsung dari Figma, dan seluruh UI akan menyusut serempak secara proporsional di semua resolusi desktop tanpa JavaScript tambahan.

## Keunggulan Menggunakan PostCSS vs CSS Zoom / Transform Scale

1. **Kompatibilitas Animasi (Framer Motion / GSAP Aman)**: Hasil akhirnya menggunakan unit CSS asli (`vw`), sehingga Framer Motion dapat membaca ukuran dimensi dan bounding box dengan akurat. Tidak ada animasi yang bergetar, melompat, atau meleset posisinya.
2. **Tidak Merusak Layout**: Berbeda dengan `transform: scale` atau `zoom`, konversi unit `vw` tidak merusak aliran layout asli dari CSS. `position: fixed` dan `position: sticky` berfungsi persis seperti seharusnya tanpa perlu trik `createPortal`.
3. **Performa Lebih Baik (Zero-Runtime)**: Konversi dilakukan pada fase *build-time* (kompilasi CSS), bukan bergantung pada eksekusi JavaScript yang melacak *event listener* `resize` di browser. Tidak ada hook, tidak ada re-render React.
4. **Mendukung Lintas Framework**: Berfungsi sempurna di Next.js (Pages/App Router), Nuxt, Vite, dan build tools lain yang memanfaatkan PostCSS.
5. **Kompatibilitas Browser Universal**: Unit `vw` didukung oleh 100% browser modern termasuk Firefox, Safari, dan browser mobile, tanpa masalah kompatibilitas seperti CSS `zoom` yang baru didukung Firefox sejak versi 126.

## Kapan Pakai Teknik Ini?

Gunakan teknik ini ketika Anda mendapat *hand-off* Figma dengan resolusi *fixed* (misalnya 1920x1080) dan klien menginginkan hasil website yang persis 1:1 identik dari layar ultra wide sampai ke layar laptop kecil (1366 / 1280), **dan** Anda sangat membutuhkan keandalan animasi (Framer Motion / GSAP) serta keamanan SEO dan aksesibilitas.

### Trigger Words / Frasa Pemicu dari User

Invoke skill ini ketika user menyebut:
- "biar gak pecah di laptop"
- "scaling otomatis"
- "pixel perfect di semua resolusi"
- "postcss viewport"
- "konversi px ke vw otomatis"
- "responsive tanpa media query"
- "copy paste dari Figma langsung responsif"

Invoke juga saat user melaporkan bug pada project yang sudah memakai teknik ini: ukuran font terlalu kecil/besar di resolusi tertentu, elemen terpotong di layar ultrawide, atau spacing tidak proporsional.

## Kapan JANGAN Pakai Teknik Ini

1. **Project menggunakan Tailwind v4 TANPA `@tailwindcss/postcss`**: Tailwind v4 secara default tidak lagi berjalan sebagai plugin PostCSS. Jika Anda tidak menginstal `@tailwindcss/postcss`, plugin px-to-viewport tidak akan pernah memproses output Tailwind.
2. **Komponen yang bergantung pada inline styles dinamis**: Jika project banyak menggunakan `style={{ width: '300px' }}` atau library pihak ketiga yang men-generate inline styles secara runtime, PostCSS **tidak akan mengonversi** nilai-nilai tersebut karena PostCSS hanya memproses file `.css` pada saat kompilasi.
3. **Layout yang membutuhkan ukuran absolut tetap**: Jika ada elemen yang ukurannya HARUS tetap sama di semua resolusi (misalnya: ikon 24px yang tidak boleh menyusut, border 1px), Anda harus meng-exclude elemen tersebut menggunakan `selectorBlackList` atau `propList`.
4. **Project mobile-first murni**: Plugin ini didesain untuk menyusutkan layout desktop. Jika project Anda murni mobile-first, teknik ini berlebihan dan bisa menyebabkan ukuran font menjadi terlalu kecil di layar mobile.

## Prasyarat Kritis: Bagaimana Plugin Ini Bekerja dengan Tailwind

> **PENTING**: Plugin ini TIDAK membaca class HTML/JSX Anda secara langsung. Alur kerjanya adalah:
>
> 1. **Tailwind CSS** men-generate file CSS dari class-class yang Anda pakai (misal: `w-[500px]` → CSS `.w-\[500px\] { width: 500px; }`)
> 2. **PostCSS px-to-viewport** memindai output CSS tersebut dan mengonversi `500px` → `26.04167vw`
> 3. Browser membaca hasil akhir berupa unit `vw`
>
> Karena itu, Tailwind **WAJIB** berjalan sebagai plugin PostCSS (bukan mode CLI standalone atau Vite plugin standalone) agar output CSS-nya masuk ke pipeline PostCSS dan bisa diproses oleh plugin px-to-viewport.

## Langkah Implementasi

### 1. Instalasi

Gunakan versi *fork* dari plugin yang kompatibel dengan PostCSS 8:
```bash
npm install -D postcss-px-to-viewport-8-plugin
# atau
yarn add -D postcss-px-to-viewport-8-plugin
# atau
pnpm add -D postcss-px-to-viewport-8-plugin
```

### 2. Konfigurasi PostCSS

Modifikasi file `postcss.config.js` (atau `postcss.config.mjs`) di root project Anda. **Urutan plugin SANGAT PENTING**: `tailwindcss` harus di atas (dijalankan lebih dulu), baru `postcss-px-to-viewport-8-plugin` di bawah.

**Untuk Tailwind v3 (Next.js / Nuxt / Vite):**
```javascript
// postcss.config.js atau postcss.config.mjs
export default {
  plugins: {
    'tailwindcss': {},                      // 1. Tailwind generate CSS dulu
    'autoprefixer': {},                     // 2. Tambah vendor prefix
    'postcss-px-to-viewport-8-plugin': {    // 3. Konversi px → vw TERAKHIR
      unitToConvert: 'px',
      viewportWidth: 1920,      // <- Lebar frame Figma (WAJIB SESUAIKAN)
      unitPrecision: 5,         // Jumlah desimal (misal: 10.12345vw)
      propList: ['*', '!border*'], // Konversi semua properti CSS KECUALI border (ketebalan/radius)
      viewportUnit: 'vw',       // Unit hasil akhir
      fontViewportUnit: 'vw',   // Unit khusus font
      selectorBlackList: [],    // Class CSS yang TIDAK dikonversi (lihat Aturan Wajib #3)
      minPixelValue: 1,         // Jangan konversi 1px (border tipis tetap 1px)
      mediaQuery: false,        // Jangan konversi px di dalam @media query
      replace: true,
      exclude: [/node_modules/], // WAJIB: Abaikan library luar
      landscape: false
    }
  }
}
```

**Untuk Tailwind v4:**
```javascript
// postcss.config.js atau postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},             // 1. Tailwind v4 via PostCSS bridge
    'postcss-px-to-viewport-8-plugin': {    // 2. Konversi px → vw
      unitToConvert: 'px',
      viewportWidth: 1920,
      unitPrecision: 5,
      propList: ['*', '!border*'], // Konversi semua properti CSS KECUALI border (ketebalan/radius)
      viewportUnit: 'vw',
      fontViewportUnit: 'vw',
      selectorBlackList: [],
      minPixelValue: 1,
      mediaQuery: true,         // WAJIB TRUE untuk Tailwind v4 agar memproses di dalam @layer
      replace: true,
      exclude: [/node_modules/],
      landscape: false
    }
  }
}
```

### 3. Workflow Development

Setelah melakukan konfigurasi PostCSS, Anda wajib **merestart server development** (`Ctrl+C` → `npm run dev` ulang).

Selanjutnya, langsung *slicing* UI mengikuti ukuran px yang tertera di Figma:
```html
<!-- Anda mengetik nilai px statis dari Figma -->
<div class="w-[500px] h-[300px] text-[24px] mt-[50px] p-[20px] gap-[16px]">
  Isi Konten
</div>
```
Browser akan membacanya sebagai unit `vw` secara otomatis. Di layar 1920px, `500px` = 26.04vw. Di layar 1280px, 26.04vw = ~333px. Proporsi tetap identik.

## Aturan Wajib

1. **Urutan Plugin PostCSS HARUS Benar.** `tailwindcss` (atau `@tailwindcss/postcss` untuk v4) WAJIB diletakkan sebelum `postcss-px-to-viewport-8-plugin`. Jika terbalik, plugin tidak akan menemukan output CSS dari Tailwind untuk dikonversi — hasilnya seluruh konversi gagal total.

2. **DILARANG Menggunakan Inline Styles dengan Nilai `px` untuk Layout.** PostCSS hanya memproses file `.css` saat kompilasi. Kode seperti `style={{ width: '300px' }}` di React/Vue TIDAK akan terkonversi ke `vw`. Jika Anda butuh ukuran dinamis, hitung manual menggunakan helper:
   ```typescript
   // helpers/viewport.ts
   const DESIGN_WIDTH = 1920
   export const pxToVw = (px: number) => `${(px / DESIGN_WIDTH) * 100}vw`
   
   // Penggunaan di komponen:
   <div style={{ width: pxToVw(300) }}>...</div>
   ```

3. **Gunakan `selectorBlackList` untuk Elemen yang Tidak Boleh Menyusut.** Jika ada elemen yang ukurannya harus tetap absolut di semua layar (misalnya: ikon kecil, border, separator), tambahkan prefix class khusus (misalnya `ignore-`) dan masukkan ke `selectorBlackList`:
   ```javascript
   selectorBlackList: ['ignore-']
   ```
   Lalu di HTML:
   ```html
   <div class="ignore-icon w-[24px] h-[24px]">...</div>  <!-- Tetap 24px, tidak dikonversi -->
   ```

4. **Waspadai Rounding Sub-Pixel.** Konversi px → vw menghasilkan angka desimal (misal: `300px` → `15.625vw`). Browser menghitung sub-pixel secara berbeda-beda. Pada layout dengan banyak elemen bersarang (nested grid/flex), pembulatan ini bisa **menumpuk** dan menghasilkan celah 1-2px. Untuk area presisi tinggi (misalnya grid card), pertimbangkan menggunakan `gap` alih-alih margin, dan hindari ketergantungan pada perhitungan persentase yang ketat antar elemen bersaudara.

5. **Berikan `max-width` Wrapper untuk Layar Ultrawide.** Karena `vw` bersifat linear terhadap lebar layar, di layar Ultrawide (21:9 / 32:9) semua elemen akan membesar tanpa batas. Pastikan ada pembungkus dengan batas maksimal:
   ```html
   <div class="max-w-[1920px] mx-auto">
     <!-- Seluruh konten halaman -->
   </div>
   ```
   **CATATAN**: Tambahkan class `max-w-[1920px]` ke `selectorBlackList` agar nilai `1920px` TIDAK ikut dikonversi menjadi `vw`. Atau gunakan unit lain: `max-w-[120rem]`.

6. **JANGAN Exclude File CSS Tailwind dari Konversi.** Jika Anda menambahkan path ke file CSS utama Tailwind (misalnya `globals.css`) ke dalam opsi `exclude`, seluruh class Tailwind tidak akan terkonversi. Opsi `exclude` hanya untuk mengabaikan CSS dari `node_modules` atau file CSS pihak ketiga.

7. **`viewportWidth` HARUS Sama dengan Lebar Frame Figma.** Jika desainer membuat frame di 1440px, set `viewportWidth: 1440`. Jika di 1920px, set `viewportWidth: 1920`. Kesalahan nilai ini akan membuat seluruh proporsi meleset.

8. **Hindari Penggunaan Unit `vh` untuk Tinggi.** Plugin ini secara default hanya mengonversi `px` ke `vw` (lebar). Jika Anda menulis `h-[1080px]` dan berharap tingginya proporsional terhadap tinggi layar, itu TIDAK akan terjadi — hasilnya tetap `vw` (berdasarkan lebar). Untuk elemen full-height, gunakan `h-screen`, `min-h-screen`, `h-full`, atau `flex-1`.

9. **Wajib `mediaQuery: true` untuk Tailwind v4.** Tailwind v4 menggunakan Cascade Layers (`@layer`) yang secara internal dianggap sebagai "Media Query" oleh plugin ini. Jika `mediaQuery` dibiarkan `false` (default), plugin akan mengabaikan seluruh class CSS dari Tailwind. Aturan ini sangat krusial agar UI berhasil melakukan *scaling* di v4.

10. **Exclude Properti Border (Ketebalan dan Radius).** Jangan mengonversi properti yang berhubungan dengan `border` (seperti `border-width`, `border-radius`, dll) karena akan membuat styling menjadi berantakan ketika di-scale (misal border menjadi terlalu tipis/hilang, atau radius melengkung tidak proporsional). Pastikan opsi `propList` disetel untuk mengecualikannya:
    ```javascript
    propList: ['*', '!border*']
    ```

## Testing Checklist

Sebelum menganggap implementasi selesai, cek manual di kondisi berikut:

- **1920x1080**: Desain harus 1:1 identik dengan Figma. Tidak ada elemen yang membesar paksa.
- **1366x768 & 1280x720**: Resolusi laptop tersempit. Seluruh UI harus mengecil proporsional secara konsisten. Periksa apakah ada celah sub-pixel yang terlihat mencolok (terutama di grid/table).
- **Ultrawide 2560x1080 (21:9)**: Pastikan wrapper `max-width` mencegah desain membesar tanpa batas. Konten harus ter-center.
- **Navbar/Modal Fixed**: Pastikan komponen `position: fixed` bekerja normal dan menempel di viewport browser (bukan terjebak di dalam wrapper).
- **Sticky Sidebar/Header**: Pastikan `position: sticky` berfungsi saat scrolling.
- **Framer Motion Animasi**: Jalankan animasi enter/exit, drag, layout animation — pastikan tidak ada lompatan posisi atau ukuran yang salah.
- **Inline Styles**: Periksa apakah ada komponen yang menggunakan inline style `px` yang tidak terkonversi (biasanya terlihat karena ukurannya tidak proporsional dibanding elemen sekitarnya).
- **Font Readability**: Di layar 1280px, pastikan teks masih terbaca dengan nyaman. Jika terlalu kecil, pertimbangkan memperbesar `font-size` di desain asli atau menggunakan `clamp()` untuk properti font.
