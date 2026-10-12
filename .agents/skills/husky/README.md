# husky

A comprehensive skill for setting up **Husky git hooks**, **Conventional Commits** (`commitlint`), **`lint-staged`**, and project-specific pre-commit quality gates — including automated validation for **PostCSS px-to-viewport** scaling classes.

## What it does

Intercepts Git actions before commits are created, guaranteeing that only high-quality, standardized code and messages reach your repository:

- **Conventional Commits (`commit-msg`)**: Enforces standard commit message format (`feat:`, `fix:`, `docs:`, `chore:`, etc.) via `@commitlint`.
- **Automated Code Formatting (`pre-commit`)**: Integrates with `lint-staged` to format and lint modified files (Prettier, ESLint, Biome) in milliseconds.
- **PostCSS Viewport Scaling Bridge (`pre-commit`)**: Connects directly with the `pixel-perfect` skill to automatically reject illegal Tailwind classes (`lg:p-4`, bare `p-[20px]`) that break responsive desktop scaling.
- **Cross-Platform**: Zero external binary dependencies; runs cleanly on Windows, macOS, Linux, and in CI/CD pipelines.

## How to invoke

Invoke this skill when setting up git hooks, configuring commit message standards, or adding pre-commit validation to a frontend or Node.js project.

Trigger words/phrases from the user:
- "setup husky"
- "conventional commit"
- "commitlint"
- "git hook pre commit"
- "check classes before commit"
- "husky check arbitrary class"
- "lint staged setup"
- "prevent bad commit"

## Architecture

```
git commit -m "feat: add hero section"
  │
  ├── 1. pre-commit
  │    ├── lint-staged (ESLint / Prettier)
  │    └── check-viewport-classes.mjs (blocks lg:p-4 & bare p-[20px])
  │
  └── 2. commit-msg
       └── commitlint (verifies "feat: ...")
            │
            └── ✅ Commit accepted
```

## Quick Example

1. **Install Husky & Commitlint**:
   ```bash
   npm install -D husky @commitlint/cli @commitlint/config-conventional lint-staged
   npx husky init
   ```

2. **Setup Commitlint (`commitlint.config.mjs`)**:
   ```javascript
   export default {
     extends: ['@commitlint/config-conventional']
   };
   ```

3. **Add `commit-msg` hook**:
   ```bash
   echo 'npx --no -- commitlint --edit "$1"' > .husky/commit-msg
   ```

4. **Add pre-commit gates in `.husky/pre-commit`**:
   ```bash
   npx lint-staged
   if [ -f "scripts/check-viewport-classes.mjs" ]; then
     node scripts/check-viewport-classes.mjs --staged
   fi
   ```

## Connecting with `pixel-perfect`

If your project uses the `pixel-perfect` skill, this Husky skill automatically adds `scripts/check-viewport-classes.mjs`.

- ❌ Commits with `lg:p-4` or `lg:text-base` are blocked with an immediate suggestion: replace with `lg:p-[16px]`.
- ❌ Commits with `p-[20px]` on mobile are blocked: move behind `lg:` or use standard `p-4`.
- ✅ Commits following the rules pass through instantly.

## See also

- [`SKILL.md`](./SKILL.md) — complete agent instructions for Husky initialization, commitlint, and custom hooks
- [`setup.md`](./setup.md) — developer reference guide and copy-paste configuration files
- [`../pixel-perfect/`](../pixel-perfect/) — Pixel-perfect responsive scaling technique (postcss-px-to-viewport)
