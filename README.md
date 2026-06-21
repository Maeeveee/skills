# tailwind-scaling

Implement CSS zoom scaling (virtual canvas) in Next.js/React so UI designs display perfectly proportional on all desktop screens without manual media queries.

## What it does

Locks the entire UI to an absolute design canvas (e.g., 1920x1080) and shrinks it proportionally via CSS `zoom` to fit smaller physical screens. Developers can copy-paste `px` values directly from Figma without converting to `rem`/`vw`. The layout never breaks on any desktop resolution.

- **`position: fixed` & `sticky` work natively**: Unlike `transform: scale`, `zoom` doesn't break fixed/sticky positioning.
- **No layout compensation**: Doesn't leave weird whitespace at the bottom of the page.
- **Lightweight**: Minimal hook code and faster browser rendering without dynamic height calculations.

## How to invoke

Invoke this skill when building complex, visual-heavy UI in Next.js (web games, internal dashboards, custom admin panels, interactive portfolios) from a fixed-resolution Figma hand-off.

Trigger words/phrases from user:
- "biar gak pecah di laptop"
- "scaling otomatis"
- "pixel perfect di semua resolusi"
- "transform scale canvas"
- "virtual canvas"

Also invoke when fixing bugs related to this technique (misplaced modals, missing scrollbars, bottom whitespace, UI not shrinking).

## Example usage

1. Copy the hook from [src/hooks/useResponsiveScale.md](src/hooks/useResponsiveScale.md) -> `useResponsiveScale.ts`
2. Copy the wrapper from [src/components/ui/ResponsiveWrapper.md](src/components/ui/ResponsiveWrapper.md) -> `ResponsiveWrapper.tsx`
3. Wrap your layout:

```tsx
import { ResponsiveWrapper } from "@/components/ui/ResponsiveWrapper"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ResponsiveWrapper>
          <header className="w-full h-[100px] flex items-center px-[50px] fixed top-0 z-50">
            <h1 className="text-[48px]">App Logo</h1>
          </header>
          <main className="flex-1 w-full min-h-0 pt-[100px]">
            {children}
          </main>
        </ResponsiveWrapper>
      </body>
    </html>
  )
}
```

## See also

- [`SKILL.md`](./SKILL.md) — full LLM-facing instructions, rules, and testing checklist
