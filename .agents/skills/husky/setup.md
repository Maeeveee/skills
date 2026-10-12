# Setup & Configuration Reference — Husky Quality Gates

Companion guide to `SKILL.md`. Use this guide when setting up Husky, Conventional Commits, `lint-staged`, and custom pre-commit quality gates in a project for the first time.

---

## 1. Installation Commands

### 1.1 Install Husky (v9+)

```bash
# npm
npm install -D husky
npx husky init

# pnpm
pnpm add -D husky
pnpm exec husky init

# yarn
yarn add -D husky
yarn dlx husky init

# bun
bun add -d husky
bunx husky init
```

### 1.2 Install Commitlint (Conventional Commits)

```bash
npm install -D @commitlint/cli @commitlint/config-conventional
# or: pnpm add -D @commitlint/cli @commitlint/config-conventional
# or: yarn add -D @commitlint/cli @commitlint/config-conventional
# or: bun add -d @commitlint/cli @commitlint/config-conventional
```

### 1.3 Install `lint-staged` (Optional but Recommended)

```bash
npm install -D lint-staged
# or: pnpm add -D lint-staged
# or: yarn add -D lint-staged
# or: bun add -d lint-staged
```

---

## 2. Configuration Files

### 2.1 `commitlint.config.mjs` (Project Root)

```javascript
/**
 * Conventional Commits Configuration
 * Format: <type>(<scope>): <subject>
 * Example: feat(auth): add OAuth2 login support
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation changes
        'style',    // Formatting, missing semicolons, etc.
        'refactor', // Code refactoring without behavioral change
        'perf',     // Performance improvements
        'test',     // Adding or updating tests
        'build',    // Changes affecting build system or external deps
        'ci',       // CI/CD configuration files and scripts
        'chore',    // Routine maintenance or repo chores
        'revert'    // Reverting previous commits
      ]
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-case': [0] // Disabled to allow flexible casing for domain terms
  }
};
```

### 2.2 `.husky/commit-msg`

```bash
npx --no -- commitlint --edit "$1"
```

---

## 3. Pre-Commit Quality Gates

### 3.1 `.husky/pre-commit`

```bash
#!/bin/sh

# 1. Staged files formatting and linting (Prettier / ESLint / Biome)
npx lint-staged

# 2. Viewport scaling validation (if check script exists)
if [ -f "scripts/check-viewport-classes.mjs" ]; then
  node scripts/check-viewport-classes.mjs --staged
fi
```

### 3.2 `package.json` Updates

```json
{
  "scripts": {
    "prepare": "husky",
    "check:classes": "node scripts/check-viewport-classes.mjs",
    "check:commit": "commitlint --from=HEAD~1"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,scss,md}": [
      "prettier --write"
    ]
  }
}
```

---

## 4. Connecting with `pixel-perfect` Skill

When a project uses the `pixel-perfect` skill, desktop proportions shrink across laptop screens (1920 → 1366 → 1280) based on `px` → `vw` conversion at build time.

To ensure developers and AI agents do not break this behavior:
1. Copy the validator script template from `templates/check-viewport-classes.mjs` in this skill into your project's `scripts/check-viewport-classes.mjs`.
2. The `.husky/pre-commit` hook will automatically execute `node scripts/check-viewport-classes.mjs --staged` on every commit.
3. If an invalid class is found:
   - `lg:p-4` (resolves to `rem`, stays frozen on laptops) → **Commit Blocked** ❌
   - `p-[20px]` (bare arbitrary px on mobile) → **Commit Blocked** ❌
   - `lg:p-[16px]` (arbitrary px for desktop) + `p-4` (built-in for mobile) → **Commit Allowed** ✅

---

## 5. Troubleshooting & FAQ

### Hook Permission Denied (`EACCES` on Linux/macOS)
Make sure the hook files are executable:
```bash
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### Husky Hooks Skipped on Windows (Git Bash vs Powershell)
Husky runs hooks via `/bin/sh`. Ensure your Git configuration handles line endings cleanly:
```bash
git config core.autocrlf true
```

### Emergency Bypass
If a critical production fix must be committed immediately:
```bash
git commit -m "fix(hotfix): patch critical outage" --no-verify
```
*(Bypasses both `pre-commit` and `commit-msg` hooks).*
