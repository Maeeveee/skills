# Skills Collection

A collection of AI agent skills (Gemini / Antigravity) that extend the agent's ability to build pixel-perfect, responsive UIs in modern frontend projects.

## Skills

| Skill | Description | Technique |
|---|---|---|
| [husky](.agents/skills/husky/) | Git hooks automation: Conventional Commits (`commitlint`), `lint-staged`, & arbitrary class pre-commit validation | Husky & Git Hooks |
| [pixel-perfect](.agents/skills/pixel-perfect/) | Automatic `px` → `vw` conversion at build-time — safe for Framer Motion, SEO, and accessibility | PostCSS Plugin |

## How to Use

These skills are automatically detected by the agent when this repository is opened as a workspace. Skills live in the `.agents/skills/` directory, following the customization root standard.

### Installing in Other Projects

Install via the `skills` CLI (works with Claude Code, OpenCode, Cursor, Codex, etc.):

```bash
# Install a specific skill
npx skills add https://github.com/Maeeveee/skills --skill husky
npx skills add https://github.com/Maeeveee/skills --skill pixel-perfect

# Install all skills in this repo
npx skills add https://github.com/Maeeveee/skills

# List available skills without installing
npx skills add https://github.com/Maeeveee/skills --list
```

Useful additional flags: `-g` (install globally, available in all projects), `-a <agent>` (target a specific agent), `-y` (skip prompts).

Alternatively, add a reference to `skills.json` in the customization root of your target project:

```json
{
  "entries": [
    { "path": "path/to/this/repo/.agents/skills" }
  ]
}
```

## Directory Structure

```
.agents/
└── skills/
    ├── husky/
    │   ├── SKILL.md          ← Full instructions for the agent
    │   ├── setup.md          ← Configuration reference
    │   ├── README.md         ← Human-facing documentation
    │   └── templates/        ← Reusable validator script templates
    └── pixel-perfect/
        ├── SKILL.md          ← Full instructions for the agent
        ├── setup.md          ← One-time setup & configuration
        ├── husky.md          ← Viewport class pre-commit hook integration
        └── README.md         ← Human-facing documentation
```
