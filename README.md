# Skills Collection

Koleksi skill untuk agen AI (Gemini / Antigravity) yang memperluas kemampuan agen dalam membangun UI pixel-perfect dan responsif di proyek frontend modern.

## Daftar Skill

| Skill | Deskripsi | Teknik |
|---|---|---|
| [tailwind-scaling](.agents/skills/tailwind-scaling/) | Virtual canvas menggunakan CSS `zoom` — UI dikunci pada resolusi Figma lalu di-shrink proporsional via JavaScript hook | CSS `zoom` + React Hook |
| [postcss-px-viewport](.agents/skills/postcss-px-viewport/) | Konversi otomatis `px` → `vw` saat build-time — aman untuk Framer Motion, SEO, dan aksesibilitas | PostCSS Plugin |

## Cara Menggunakan

Skill-skill ini otomatis terdeteksi oleh agen saat repository ini terbuka sebagai workspace. Skill berada di dalam direktori `.agents/skills/` sesuai standar customization root.

### Memasang di Project Lain

Untuk menggunakan skill ini di project lain, tambahkan referensi ke `skills.json` di customization root project target Anda:

```json
{
  "entries": [
    { "path": "path/to/this/repo/.agents/skills" }
  ]
}
```

## Struktur Direktori

```
.agents/
└── skills/
    ├── tailwind-scaling/
    │   ├── SKILL.md          ← Instruksi lengkap untuk agen
    │   └── README.md         ← Dokumentasi human-facing
    └── postcss-px-viewport/
        ├── SKILL.md          ← Instruksi lengkap untuk agen
        └── README.md         ← Dokumentasi human-facing
```
