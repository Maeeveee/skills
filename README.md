# Skills Collection

A collection of AI agent skills (Gemini / Antigravity) that extend the agent's ability to build pixel-perfect, responsive UIs in modern frontend projects.

## Skills

| Skill | Description | Technique |
|---|---|---|
| [postcss-px-viewport](.agents/skills/postcss-px-viewport/) | Automatic `px` → `vw` conversion at build-time — safe for Framer Motion, SEO, and accessibility | PostCSS Plugin |

## How to Use

These skills are automatically detected by the agent when this repository is opened as a workspace. Skills live in the `.agents/skills/` directory, following the customization root standard.

### Installing in Other Projects

Install via the `skills` CLI (works with Claude Code, OpenCode, Cursor, Codex, etc.):

```bash
# Install a specific skill
npx skills add https://github.com/Maeeveee/skills --skill postcss-px-viewport

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
    └── postcss-px-viewport/
        ├── SKILL.md          ← Full instructions for the agent
        ├── setup.md          ← One-time setup & configuration
        └── README.md         ← Human-facing documentation
```
