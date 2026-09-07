# Skills Collection

Koleksi skill untuk agen AI (Gemini / Antigravity) yang memperluas kemampuan agen dalam membangun UI pixel-perfect dan responsif di proyek frontend modern.

## Daftar Skill

| Skill | Deskripsi | Teknik |
|---|---|---|
| [postcss-px-viewport](.agents/skills/postcss-px-viewport/) | Konversi otomatis `px` → `vw` saat build-time — aman untuk Framer Motion, SEO, dan aksesibilitas | PostCSS Plugin |

## Cara Menggunakan

Skill-skill ini otomatis terdeteksi oleh agen saat repository ini terbuka sebagai workspace. Skill berada di dalam direktori `.agents/skills/` sesuai standar customization root.

### Memasang di Project Lain

Install via `skills` CLI (works for Claude Code, OpenCode, Cursor, Codex, dll):

```bash
# Install skill spesifik
npx skills add https://github.com/Maeeveee/skills --skill postcss-px-viewport

# Install semua skill dalam repo ini
npx skills add https://github.com/Maeeveee/skills

# Lihat daftar skill yang tersedia tanpa install
npx skills add https://github.com/Maeeveee/skills --list
```

Tambahan flag yang berguna: `-g` (install global, tersedia di semua project), `-a <agent>` (target agent spesifik), `-y` (skip prompt).

Alternatifnya, tambahkan referensi ke `skills.json` di customization root project target Anda:

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
    └── postcss-px-viewport/
        ├── SKILL.md          ← Instruksi lengkap untuk agen
        ├── setup.md          ← Setup & konfigurasi one-time
        └── README.md         ← Dokumentasi human-facing
```
