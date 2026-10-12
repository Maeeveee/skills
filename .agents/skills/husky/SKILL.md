---
name: husky
description: "Set up and configure Husky git hooks, Conventional Commits (commitlint), lint-staged, and custom quality gates (including pixel-perfect arbitrary class enforcement). Use when initializing git hooks, enforcing commit message standards, or setting up pre-commit code quality pipelines in modern frontend and Node.js projects."
---

# Husky Git Hooks & Quality Gates

Enforce git standards before commits reach repository history:
1. **`commit-msg` gate**: Enforces **Conventional Commits** (`feat:`, `fix:`, `chore:`, etc.) via `@commitlint`.
2. **`pre-commit` gate (Formatting & Linting)**: Runs `lint-staged` with ESLint/Prettier/Biome.
3. **`pre-commit` gate (Pixel-Perfect Scaling Bridge)**: Rejects illegal Tailwind classes (`lg:p-4`, bare `p-[20px]`) when the project uses the `pixel-perfect` technique.

---

## Package Manager Detection

Detect package manager from lockfile before running any command:
- `pnpm-lock.yaml` → `pnpm add -D <pkg>` / `pnpm exec husky init`
- `yarn.lock` → `yarn add -D <pkg>` / `yarn dlx husky init`
- `bun.lockb` / `bun.lock` → `bun add -d <pkg>` / `bunx husky init`
- `package-lock.json` or fallback → `npm install -D <pkg>` / `npx husky init`

---

## Modular Execution Scenarios

Analyze user intent and existing repository setup to apply the relevant gate(s):

### Gate 1: Conventional Commits (`commit-msg`)

Apply when the user requests commit message conventions, commitlint, or standard commit formatting.

1. **Install dependencies**:
   ```bash
   npm install -D @commitlint/cli @commitlint/config-conventional
   ```

2. **Create `commitlint.config.mjs`** at project root:
   ```javascript
   export default {
     extends: ['@commitlint/config-conventional'],
     rules: {
       'type-enum': [
         2,
         'always',
         ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert']
       ],
       'subject-case': [0] // Flexible casing for technical terms / non-English
     }
   };
   ```

3. **Configure `.husky/commit-msg`**:
   ```bash
   npx --no -- commitlint --edit "$1"
   ```

---

### Gate 2: Code Quality & Staged Formatting (`pre-commit`)

Apply when formatting or linting staged files prior to commit.

1. **Install `lint-staged`**:
   ```bash
   npm install -D lint-staged
   ```

2. **Add `lint-staged` to `package.json`**:
   ```json
   {
     "lint-staged": {
       "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
       "*.{json,css,scss,md}": ["prettier --write"]
     }
   }
   ```

3. **Add to `.husky/pre-commit`**:
   ```bash
   npx lint-staged
   ```

---

### Gate 3: Pixel-Perfect Viewport Bridge (`pre-commit`)

> [!IMPORTANT]
> **Conditional Activation**: ONLY install this bridge if:
> 1. The project uses `postcss-px-to-viewport-8-plugin` (inspect `postcss.config.*` or `package.json`), OR
> 2. The user explicitly requests viewport/scaling/arbitrary-class validation.
> Do NOT install on unrelated projects.

1. **Copy validator script**:
   Copy the template from this skill's `templates/check-viewport-classes.mjs` to the target project's `scripts/check-viewport-classes.mjs`.

2. **Add to `.husky/pre-commit`**:
   ```bash
   if [ -f "scripts/check-viewport-classes.mjs" ]; then
     node scripts/check-viewport-classes.mjs --staged
   fi
   ```

3. **Add convenience scripts to `package.json`**:
   ```json
   {
     "scripts": {
       "check:classes": "node scripts/check-viewport-classes.mjs",
       "check:classes:desktop": "node scripts/check-viewport-classes.mjs --desktop-only"
     }
   }
   ```

---

## Full Stack Setup (Orchestrated `.husky/pre-commit`)

When setting up the complete pipeline, combine gates cleanly:

```bash
#!/bin/sh

# 1. Run staged formatting & linting
npx lint-staged

# 2. Check pixel-perfect Tailwind classes (if using pixel-perfect technique)
if [ -f "scripts/check-viewport-classes.mjs" ]; then
  node scripts/check-viewport-classes.mjs --staged
fi
```

And ensure `package.json` has:
```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

---

## Verification & Self-Check

Verify newly installed hooks by testing valid and invalid states:

1. **Test `commit-msg`**:
   - `git commit -m "bad message"` → ❌ Aborted: *type may not be empty*.
   - `git commit -m "feat: valid message"` → ✅ Accepted.

2. **Test `pre-commit` Viewport Check** (if active):
   - Stage a file containing `lg:p-4` or bare `p-[20px]`.
   - `git commit -m "test: verify"` → ❌ Aborted: displays line, token, and fix suggestion.
   - Fix to `lg:p-[16px]` and built-in mobile classes → ✅ Accepted.

3. **Emergency Bypass**:
   ```bash
   git commit -m "hotfix: urgent change" --no-verify
   ```
