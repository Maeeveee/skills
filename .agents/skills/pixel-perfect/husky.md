# Automated Pre-Commit Linting for Pixel-Perfect Classes

In the `pixel-perfect` technique, desktop layers (`lg:`, `xl:`, `2xl:`) **must** use arbitrary `px` values (`lg:w-[500px]`, `lg:p-[40px]`), while mobile layers use built-in classes (`p-4`). Built-in numeric scales at desktop (`lg:p-4`) resolve to `rem` and will stay frozen on laptops, breaking responsive scaling.

To prevent invalid classes from ever entering your git history, use the companion [**husky skill**](../husky/README.md).

> [!IMPORTANT]
> ### Husky Skill Not Installed Yet?
> If your project doesn't have the `husky` skill installed yet, install it via the `skills` CLI (supports `npx` or `bunx`):
>
> ```bash
> # Using npx
> npx skills add https://github.com/Maeeveee/skills --skill husky
>
> # Using bunx
> bunx skills add https://github.com/Maeeveee/skills --skill husky
> ```

---

## Quick Integration

Once the `husky` skill is available (or if your project already uses Husky):

### 1. Add the Viewport Checker Script

Copy the zero-dependency validator from this skill into your project's `scripts/` directory:

```bash
# Path in skills repo:
# .agents/skills/pixel-perfect/scripts/check-viewport-classes.mjs -> scripts/check-viewport-classes.mjs
```

### 2. Configure `.husky/pre-commit`

Add the validation check to your `.husky/pre-commit` hook:

```bash
#!/bin/sh

# Staged files check (<50ms, zero external dependencies)
if [ -f "scripts/check-viewport-classes.mjs" ]; then
  node scripts/check-viewport-classes.mjs --staged
fi
```

### 3. Add npm Scripts to `package.json`

```json
{
  "scripts": {
    "check:classes": "node scripts/check-viewport-classes.mjs",
    "check:classes:desktop": "node scripts/check-viewport-classes.mjs --desktop-only"
  }
}
```

---

## Verification Behavior

- ❌ **Blocked on Commit**: `lg:p-4`, `lg:gap-6`, `lg:text-base` (built-in scale at desktop) or `p-[20px]` (bare arbitrary px at mobile).
- ✅ **Allowed on Commit**: `lg:p-[16px]`, `lg:w-[500px]` (desktop arbitrary px) and `p-4` (mobile built-in).

For full git hooks setup including **Conventional Commits** (`commitlint`) and `lint-staged`, refer to [`.agents/skills/husky/`](../husky/README.md).
