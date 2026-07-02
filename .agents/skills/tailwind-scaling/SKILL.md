---
name: tailwind-scaling
description: 'Implementasikan CSS zoom scaling (virtual canvas) di project Next.js/React supaya UI hasil desain Figma beresolusi tetap (misal 1920x1080) tampil proporsional pixel-perfect di semua ukuran layar desktop (1920 turun sampai 1280, termasuk ultrawide) tanpa menulis media query manual atau konversi px ke rem/vw. WAJIB dipakai ketika user membangun UI kompleks dan visual-heavy di Next.js (game web, dashboard internal, admin panel custom, portofolio interaktif) dari hand-off Figma beresolusi tetap, atau saat user menyebut istilah seperti "biar gak pecah di laptop", "scaling otomatis", "pixel perfect di semua resolusi", "transform scale canvas", atau "virtual canvas". Gunakan juga skill ini saat user melaporkan bug pada project yang sudah memakai teknik ini - modal/dropdown salah posisi atau ke-crop, scrollbar hilang, whitespace aneh di bawah halaman, atau UI tidak ikut menyusut di laptop kecil.'
---

# Next.js Canvas Scaling (CSS Zoom)

Teknik ini mengunci seluruh UI pada kanvas desain absolut (misal 1920x1080), lalu menyusutkan kanvas itu secara proporsional via properti CSS `zoom` agar pas di layar fisik yang lebih kecil (1366, 1280, dst). Hasilnya: developer bisa copy-paste angka `px` langsung dari Figma tanpa konversi satuan, dan layout tidak pernah "pecah" di resolusi desktop manapun.

## Keunggulan Menggunakan `zoom` vs Pendekatan Lama (`transform: scale`)

1. **`position: fixed` Berjalan Sempurna**: Tidak seperti `transform`, `zoom` tidak menciptakan *containing block* baru. Komponen seperti Navbar, Modal, dan Toast akan tetap menempel di viewport browser seperti seharusnya, tanpa perlu trik `createPortal`.
2. **`position: sticky` Bekerja Native**: Elemen Sidebar, Header Table, atau FAQ Title akan tetap berfungsi melayang secara native.
3. **Tidak Perlu Kompensasi Layout**: Karena `zoom` memengaruhi DOM layout (flow) secara natural, tidak ada sisa *whitespace* di bagian bawah halaman. Anda tidak perlu menggunakan `ResizeObserver` atau memberikan `margin-bottom` negatif.
4. **Lebih Ringan**: Kode hook jauh lebih sedikit dan perenderan browser menjadi lebih cepat tanpa kalkulasi tinggi dinamis.

## Kapan Pakai, Kapan Tidak

Pakai teknik ini untuk **area aplikasi** yang UI-nya kompleks dan presisi visual tinggi: workspace dashboard, game web, admin panel custom, builder/editor interaktif. Target utama adalah layar desktop (laptop kecil sampai ultrawide), bukan mobile portrait — di bawah lebar 1024px dalam orientasi portrait, scaling otomatis OFF (lihat kondisi `isDesktop` di hook), jadi halaman tetap harus dibangun mobile-first dengan Tailwind breakpoint normal untuk kondisi itu.

JANGAN pakai untuk: halaman marketing/landing/blog yang SEO-sensitive dan butuh reflow teks alami; halaman dengan kebutuhan accessibility ketat di mana user mengandalkan native browser zoom/text-resize (meski zoom lebih ramah dibanding transform, standar aksesibilitas tetap merekomendasikan reflow alami).

## Langkah Implementasi

1. Buat hook di `hooks/useResponsiveScale.ts` (kode lengkap di bawah).
2. Buat komponen pembungkus di `components/ui/ResponsiveWrapper.tsx`.
3. Pasang `ResponsiveWrapper` mengelilingi layout root dari segmen aplikasi yang relevan (`app/(app)/layout.tsx` atau `app/layout.tsx` kalau seluruh app memang workspace).
4. Bangun semua UI di dalam wrapper dengan asumsi kanvas tetap 1920x1080 (atau 1366x768 untuk landscape mobile) — langsung pakai angka px dari Figma.

## Kode 1: Hook Utama

```typescript
// hooks/useResponsiveScale.ts
"use client"
import { useSyncExternalStore } from "react"

type Snapshot = {
  scale: number
  isDesktop: boolean
  isClient: boolean
  referenceWidth: number
  referenceHeight: number
}

let snapshot: Snapshot = { scale: 1, isDesktop: false, isClient: false, referenceWidth: 1920, referenceHeight: 1080 }
const listeners = new Set<() => void>()

if (typeof window !== "undefined") {
  snapshot = { ...snapshot, isClient: true }

  const computeSnapshot = () => {
    const w = window.innerWidth
    const h = window.innerHeight

    if (w === 0 || h === 0) return

    // Catatan: window landscape sempit (lebar < 1024 dan lebar > tinggi) dianggap "landscape mobile"
    const isLandscapeMobile = w < 1024 && w > h
    const desktop = w >= 1024 || isLandscapeMobile

    // Base canvas size (ukuran desain absolut dari Figma)
    const baseHeight = isLandscapeMobile ? 768 : 1080
    const minWidth = isLandscapeMobile ? 1366 : 1920

    // Kalkulasi ultrawide (menghindari black bar di samping)
    const dynamicWidth = baseHeight * (w / h)
    const refWidth = Math.max(minWidth, dynamicWidth)
    const refHeight = baseHeight

    // Fit-to-screen, tidak pernah membesar lewat 100%
    const scaleX = w / refWidth
    const scaleY = h / refHeight
    const newScale = (desktop && (w < refWidth || h < refHeight)) ? Math.min(scaleX, scaleY, 1) : 1

    if (snapshot.scale !== newScale || snapshot.isDesktop !== desktop || snapshot.referenceWidth !== refWidth || snapshot.referenceHeight !== refHeight) {
      snapshot = { scale: newScale, isDesktop: desktop, isClient: true, referenceWidth: refWidth, referenceHeight: refHeight }
      listeners.forEach(l => l())
    }
  }

  let rafId: number | null = null
  const handleResize = () => {
    if (rafId !== null) return
    rafId = requestAnimationFrame(() => {
      rafId = null
      computeSnapshot()
    })
  }

  computeSnapshot()

  const globalWindow = window as typeof window & { __responsiveScaleInit?: boolean }
  if (!globalWindow.__responsiveScaleInit) {
    globalWindow.__responsiveScaleInit = true
    window.addEventListener("resize", handleResize)
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function getSnapshot() { return snapshot }

const SERVER_SNAPSHOT: Snapshot = { scale: 1, isDesktop: false, isClient: false, referenceWidth: 1920, referenceHeight: 1080 }
function getServerSnapshot() { return SERVER_SNAPSHOT }

export function useResponsiveScale() {
  const { scale, isDesktop, isClient, referenceWidth, referenceHeight } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const shouldScale = isClient && scale !== 1 && isDesktop

  return {
    scale,
    isClient,
    isDesktop,
    shouldScale,
    referenceWidth,
    referenceHeight,
    // Gunakan objek ini sebagai style pada elemen wrapper kanvas
    zoomStyle: {
      zoom: shouldScale ? scale : 1,
      width: shouldScale ? `${referenceWidth}px` : "100%",
      minHeight: shouldScale ? `${referenceHeight}px` : "100vh",
    } as React.CSSProperties,
  }
}
```

## Kode 2: Wrapper Component

Buat wrapper untuk menampung seluruh layout. Tidak perlu lagi memakai teknik portal atau kompensasi overflow yang rumit. Pastikan tidak ada class `overflow-x-clip` atau properti `overflow` lainnya pada ancestor yang dapat memblokir `position: sticky`.

```tsx
// components/ui/ResponsiveWrapper.tsx
"use client"
import { useResponsiveScale } from "@/hooks/useResponsiveScale"
import { ReactNode } from "react"

export function ResponsiveWrapper({ children }: { children: ReactNode }) {
  const { zoomStyle } = useResponsiveScale()

  return (
    <div className="w-full min-h-screen">
      <div style={zoomStyle} className="mx-auto flex flex-col relative">
        <div className="flex-1 w-full flex flex-col min-h-0">
          {children}
        </div>
      </div>
    </div>
  )
}
```

## Pemasangan di Layout

```tsx
// app/layout.tsx atau app/(app)/layout.tsx
import { ResponsiveWrapper } from "@/components/ui/ResponsiveWrapper"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ResponsiveWrapper>
          <header className="w-full h-[100px] flex items-center px-[50px] fixed top-0 z-50">
            <h1 className="text-[48px]">Logo Aplikasi</h1>
          </header>
          <main className="flex-1 w-full min-h-0 pt-[100px]">
            {children}
          </main>
        </ResponsiveWrapper>
      </body>
    </html>
  )
}
```

## Aturan Wajib

1. **Dilarang `100vh` / `h-screen` di dalam kanvas.** Saat tinggi layar fisik kecil, `100vh` dihitung dari tinggi fisik browser asli lalu memanjang tidak terduga. Pakai `h-full`, `min-h-full`, atau `flex-1` pada anak elemen supaya mengisi `referenceHeight` virtual, bukan viewport fisik.
2. **Turunkan breakpoint desktop khusus** (`xl:`, `2xl:`) jadi `lg:` atau hapus. Kanvas virtual selalu "terasa" 1920px bagi Tailwind walau layar fisik 1280px.
3. **Komponen Animasi Framer Motion dan Sticky**: Hati-hati menaruh `position: sticky` pada komponen yang sedang dianimasikan (misal `motion.div`). `transform` dari animasi akan langsung membatalkan fungsi `sticky`. Bungkus komponen tersebut dengan `div` biasa yang memiliki class `sticky`.
4. **Hindari `overflow` pada Ancestor**: Pastikan `ResponsiveWrapper` atau body *TIDAK* memiliki `overflow-x-clip` atau `overflow-x-hidden`. Properti overflow apapun selain `visible` di ancestor akan membuat `position: sticky` gagal mendeteksi viewport browser.
5. **Hindari `max-w-*` + `mx-auto` di dalam kanvas.** Kanvas virtual sudah dikalkulasi selebar mungkin untuk menghindari crop di layar lebar; biarkan menggunakan `w-full` agar kanvas menyerap selebar layar ultrawide.
6. **Guard pembagian nol di kalkulasi ultrawide.** Hook di atas sudah early-return kalau `w === 0 || h === 0` (biasa terjadi saat docking devtools); jangan dihapus karena ini mencegah scale bernilai 0 yang membuat UI hilang total.
7. **Throttle resize dengan `requestAnimationFrame`** dan gunakan variabel `globalWindow.__responsiveScaleInit` untuk menghindari listener resize menumpuk saat Hot Module Reloading di fase development.

## Testing Checklist

Sebelum menganggap implementasi selesai, cek manual di kondisi berikut: 
- **1920x1080**: Scale harus tepat 1:1 tanpa ada pembesaran paksa.
- **1366x768 & 1280x720**: Resolusi laptop tersempit. UI harus mengecil dengan konsisten layaknya video (pixel perfect).
- **Ultrawide 21:9**: Pastikan kanvas memanjang tanpa *black bar* aneh di kiri kanan.
- **Navbar/Modal Fixed**: Pastikan komponen `fixed` bekerja normal tanpa terperangkap ke ukuran kanvas, dan Sticky Sidebar/Filter Sidebar harus berfungsi meluncur normal saat scrolling.