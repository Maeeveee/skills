---
name: husky
description: "Set up and configure Husky git hooks, Conventional Commits (commitlint), lint-staged, and custom quality gates (including pixel-perfect arbitrary class enforcement). Use when initializing git hooks, enforcing commit message standards, or setting up pre-commit code quality pipelines in modern frontend and Node.js projects."
---

# Husky Git Hooks & Quality Gates

Enforce git standards before commits reach repository history:
1. **Core Setup**: Install Husky v9 and prepare clean hooks.
2. **`commit-msg` gate**: Enforce **Conventional Commits** (`feat:`, `fix:`, `chore:`, etc.) via `@commitlint`.
3. **`pre-commit` gate (Formatting & Linting)**: Run `lint-staged` adaptively (Biome, ESLint, Prettier).
4. **`pre-commit` gate (Pixel-Perfect Bridge)**: Enforce arbitrary px rules when `pixel-perfect` is used.

> [!CAUTION]
> **No Bypass for AI**: The AI agent is STRICTLY FORBIDDEN from running `git commit --no-verify`. If a hook fails, inspect the output and fix the underlying code or commit message. Only the human user may decide to bypass git gates.

---

## 1. Package Manager & Tooling Detection

Detect the package manager and linter from project files before running commands:

| Lockfile | Install Command | Exec Command |
|---|---|---|
| `pnpm-lock.yaml` | `pnpm add -D <pkg>` | `pnpm exec <cmd>` |
| `yarn.lock` | `yarn add -D <pkg>` | `yarn dlx <cmd>` (v2+) or `npx <cmd>` (v1) |
| `bun.lockb` / `bun.lock` | `bun add -d <pkg>` | `bunx <cmd>` |
| `package-lock.json` / fallback | `npm install -D <pkg>` | `npx <cmd>` |

Also check code formatting tooling:
- `biome.json` present → use Biome.
- `eslint.config.*` / `.eslintrc*` / `.prettierrc*` present → use ESLint + Prettier.

---

## 2. Core Husky Setup

Run Husky initialization:

```bash
# 1. Install husky
<install-cmd> husky

# 2. Initialize husky (creates .husky/ and adds prepare script to package.json)
<exec-cmd> husky init
```

> [!IMPORTANT]
> `husky init` automatically writes `npm test` into `.husky/pre-commit` by default. **Always replace or clear the `npm test` line** with your desired pre-commit commands so commits do not run test suites unexpectedly.

---

## 3. Modular Gates

Apply only the gate(s) requested or relevant to the project:

### Gate A: Conventional Commits (`commit-msg`)

Apply when the user asks for commitlint, conventional commits, or standardized commit messages.

1. **Install dependencies**:
   ```bash
   <install-cmd> @commitlint/cli @commitlint/config-conventional
   ```

2. **Create `commitlint.config.mjs`** at project root:
   ```javascript
   export default {
     extends: ['@commitlint/config-conventional'],
     rules: {
       'subject-case': [0] // Allow flexible casing for technical terms / non-English
     }
   };
   ```

3. **Configure `.husky/commit-msg`**:
   ```bash
   npx --no -- commitlint --edit "$1"
   ```

---

### Gate B: Code Quality & Formatting (`pre-commit`)

Apply when formatting or linting staged files prior to commit.

1. **Install `lint-staged`**:
   ```bash
   <install-cmd> lint-staged
   ```

2. **Configure `package.json` adaptively**:

   **If using Biome:**
   ```json
   {
     "lint-staged": {
       "*.{js,ts,jsx,tsx,json}": ["biome check --write --no-errors-on-unmatched"]
     }
   }
   ```

   **If using ESLint / Prettier:**
   ```json
   {
     "lint-staged": {
       "*.{js,jsx,ts,tsx,vue,astro,svelte}": ["eslint --fix", "prettier --write"],
       "*.{json,css,scss,md}": ["prettier --write"]
     }
   }
   ```

3. **Add to `.husky/pre-commit`**:
   ```bash
   npx lint-staged
   ```

---

### Gate C: Pixel-Perfect Viewport Bridge (`pre-commit`)

> [!IMPORTANT]
> **Conditional Activation**: ONLY install this bridge if:
> 1. The project uses `postcss-px-to-viewport-8-plugin` (inspect `postcss.config.*` or `package.json`), OR
> 2. The user explicitly requests viewport/scaling/arbitrary-class validation.
> Do NOT install on unrelated projects.
>
> **Finding the validator script**:
> - If the `pixel-perfect` skill is present in your workspace, copy `scripts/check-viewport-classes.mjs` from that skill's directory into the project's `scripts/check-viewport-classes.mjs`.
> - If `pixel-perfect` is not yet installed in your workspace, install it first via `npx skills add https://github.com/Maeeveee/skills --skill pixel-perfect` (or skip Gate C if the project does not use px-to-viewport scaling).

1. **Copy validator script**:
   Copy `scripts/check-viewport-classes.mjs` from the `pixel-perfect` skill into the target project's `scripts/check-viewport-classes.mjs`.

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

## 4. Full Orchestrated Example

When setting up the full pipeline, `.husky/pre-commit` should look like this (replacing the default `npm test`):

```bash
#!/bin/sh

# 1. Staged files formatting and linting
npx lint-staged

# 2. Viewport scaling validation (if script exists)
if [ -f "scripts/check-viewport-classes.mjs" ]; then
  node scripts/check-viewport-classes.mjs --staged
fi
```

And `.husky/commit-msg`:
```bash
npx --no -- commitlint --edit "$1"
```

---

## 5. Verification Checklist

Always test the gates after installation:

1. **Verify Commit Message Gate**:
   - `git commit -m "bad message"` → Must fail with *type may not be empty*.
   - `git commit -m "feat: add user authentication"` → Must succeed.

2. **Verify Pre-commit Gate** (if Viewport Bridge is active):
   - Stage a file with `lg:p-4` → Commit must be blocked with fix suggestion.
   - Stage a file with `lg:p-[16px]` → Commit must pass.
