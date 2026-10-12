# Troubleshooting & Platform Reference — Husky Git Hooks

Companion troubleshooting guide to [`SKILL.md`](SKILL.md). For standard setup, gate configurations, and rules, refer directly to `SKILL.md`.

---

## 1. Common Issues & Solutions

### Hook Permission Denied (`EACCES` on Linux / macOS)
If Git fails with permission denied when executing hooks:
```bash
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### Husky Hooks Skipped on Windows (CRLF / Git Bash)
Husky executes hook scripts using POSIX `/bin/sh`. Windows line endings (`CRLF`) in hook files can cause execution failures (`\r: command not found`). Ensure Git handles line endings cleanly:
```bash
git config core.autocrlf true
```

### Pre-commit Runs `npm test` Unexpectedly
When `husky init` runs, it generates `.husky/pre-commit` containing `npm test` by default. If your project doesn't have a test script or you only want linting/scaling checks, edit `.husky/pre-commit` and replace `npm test` with your desired commands (such as `npx lint-staged`).

### CI / CD Environments
In automated CI runners (GitHub Actions, GitLab CI), hooks usually should not run on `npm ci`. Husky handles this automatically if `CI=true` is set. If needed, you can bypass hook installation in CI by omitting `prepare` or setting:
```bash
npm ci --ignore-scripts
```

---

## 2. Emergency Human Bypass

> [!CAUTION]
> The AI coding agent is **strictly forbidden** from bypassing hooks. If a hook fails, the agent must inspect the errors and fix the code.

Only a human developer may choose to bypass git hooks during a critical emergency hotfix:

```bash
git commit -m "fix(hotfix): patch critical outage" --no-verify
```
