# SkillSwap Landing Page — Builder Output

Executed against: `C:\Users\Oluwatosin\FinalYear\skillswap` (not a git repo — no
version control exists in this directory, so no commit/diff history to attach).
Source spec: `prompts/landing_page.md`.

## What was built

### Part A/C — route structure decision

The spec's Part A says to create `src/app/(marketing)/page.tsx` + a
`(marketing)/layout.tsx`, but Part C immediately corrects itself: Next.js App
Router route groups are **not** part of the URL path, so
`redirect('/(marketing)')` is invalid, and a route group's page can't be
reached at `/` unless it's the only root layout in play. I confirmed this
against `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route-groups.md`
and `.../04-functions/redirect.md` (per `AGENTS.md`'s instruction to check the
bundled docs for this Next.js version rather than trusting training data —
nothing about route groups or `redirect()` turned out to differ from the
documented behavior, but the caveat about a route group needing to own `/` if
used as a root layout confirmed the spec's own correction was right).

So, per the spec's final instruction in Part C: **no `(marketing)` folder was
created.** The landing page is written directly as `src/app/page.tsx`, which
is exactly the structure the file already had (root `page.tsx` outside any
route group, doing a server-side auth check and redirecting authenticated
users to `/dashboard`). This also avoids any risk of a route-group/root path
conflict with the existing `(app)`, `(auth)`, and `(superadmin)` groups.

### Files created

- **`src/components/marketing/MarketingNav.tsx`** — client component (`'use
  client'`), used verbatim from the spec's Part E code block: sticky nav,
  desktop links (`#how-it-works`, `/match`, `#features`, `#for-students`),
  Log In / Get Started buttons, and a hamburger-toggled mobile dropdown with
  the same links. Colour references updated from Tailwind's `indigo-600`
  token to the spec's explicit `#4F46E5` hex to match Part D's palette.
- **`src/components/marketing/FeatureCard.tsx`** — reusable card
  (icon, title, description, tag pill) used by the 6-feature grid.
- **`src/components/marketing/TestimonialCard.tsx`** — reusable card
  (5-star row, italic quote, name, course) used by the testimonials section.

### `src/app/page.tsx` — full rewrite

Replaced the previous landing page (which used Material Symbols font icons
and a "glass card" visual style) with a server component containing all 10
sections from Part B, in order, each with the copy specified verbatim:

1. **Nav** — `<MarketingNav />`.
2. **Hero** — `#F5F3FF` background, pill badge, 38px/56px responsive H1,
   18px subheadline, "Start Swapping →" (`/register`) + "Browse Skills"
   (`/match`) CTAs, 3-avatar social proof line, and a CSS-only floating card
   mockup (match card, session-active card, credit-balance card) — `hidden
   md:block` so it's absent on mobile per Part D.
3. **How It Works** (`id="how-it-works"`) — 3 numbered steps with inline SVG
   icons (person / hub / swap-arrows).
4. **Key Features** (`id="features"`) — 6 `FeatureCard`s in a
   `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` grid, each with a hand-drawn
   stroke-based SVG icon (24×24, 2px stroke, `currentColor`) since the spec
   explicitly forbids Material Symbols/Lucide on this page.
5. **What Is a Skill?** (`id="for-students"`) — two-column layout; right
   side renders the 4 given rows of example skills as indigo pill tags.
   I mapped the nav's "For Students" link to this section's anchor, since
   it's the section that speaks directly to a prospective student ("what can
   I actually list here?") — the spec names the anchor but doesn't say which
   section it should point to.
6. **Trust & Accountability** — comparison rendered as a two-column `div`
   grid (not an HTML `<table>`, per Part F), red-tinted "Without" column,
   green-tinted "With SkillSwap" column, all 6 rows from the spec.
7. **Live Activity Feed** — dark-navy (`#0F1729`) section, the 3 static rows
   exactly as specified, plus the indigo CTA card ("Create Your Profile →").
8. **Testimonials** — 3 `TestimonialCard`s with the exact quotes/names/
   courses given.
9. **Final CTA** — indigo→purple gradient (`#4F46E5 → #6B38D4`), both CTA
   buttons, small-print line.
10. **Footer** — dark navy (`#1E3A5F`), 4 columns as specified, bottom bar
    copyright line.

All internal navigation uses `next/link`. All colours use the exact hex
values from Part D's palette. Section anchors (`how-it-works`, `features`,
`for-students`) match the nav's hash links. No `next/image`, no third-party
scripts, no client components except `MarketingNav` (mobile toggle only) —
everything else is a server component.

## Part G — route verification

Confirmed on disk (no dev server run, per file presence):
- `src/app/(auth)/login/page.tsx` exists
- `src/app/(auth)/register/page.tsx` exists
- `src/app/(app)/dashboard/page.tsx` exists
- `src/app/(superadmin)/superadmin/page.tsx` exists
- No path collides with root `src/app/page.tsx` (it sits outside every route
  group, so `/` is uniquely owned by it — same as before this change)

`/` behavior: unauthenticated visitors see the new landing page (server
component calls `supabase.auth.getUser()`); authenticated users are
`redirect('/dashboard')`'d before any landing-page markup renders.
`/dashboard` and `/superadmin` auth-gating is handled by their own existing
layouts/route groups and was not touched.

## TypeScript output

```
$ cd skillswap && npx tsc --noEmit
(no output)
$ echo $?
0
```

Clean — zero TypeScript errors.

Also ran `npx eslint src/app/page.tsx src/components/marketing` as an extra
check (not requested by the spec, but cheap): exit code `0`, no lint errors.

## What was NOT touched

Per Part H's closing instruction: no Playwright run, and no changes to any
existing auth pages, API routes, or database migrations. The prior landing
page's copy/visual style (Material Symbols icons, glass-card float
animation) was fully replaced, since the spec calls for a complete rewrite
with a different icon system and section set — nothing from the old
`page.tsx` was preserved.

## Follow-up fix — `/` was redirecting unauthenticated visitors to `/login`

Root cause was not in `page.tsx` — its auth check was already correct
(`if (user) redirect('/dashboard')`, with no `else` branch, so unauthenticated
visitors fall through to the landing page markup). The redirect was coming
from `src/middleware.ts`: its `publicPaths` allowlist (`/login`, `/register`,
`/auth/callback`, `/auth/verify`, `/auth/confirm`) never included `/`, so the
middleware's `if (!user && !isPublicPath && !isApiPath)` guard caught the
root path for every signed-out request and redirected it to `/login` before
`page.tsx` ever ran.

Fix applied to `src/middleware.ts`:

```typescript
const publicPaths = ['/', '/login', '/register', '/auth/callback', '/auth/verify', '/auth/confirm']
const isPublicPath = publicPaths.some((p) => (p === '/' ? pathname === '/' : pathname.startsWith(p)))
```

Note this is **not** a plain `pathname.startsWith(p)` for every entry —
`isPublicPath` used `startsWith` matching, and since literally every
pathname starts with `/`, adding `'/'` to the array under that matching rule
would have made `isPublicPath` always `true`, disabling the auth gate for
the entire site (every route, not just the landing page, would have become
publicly accessible). The fix special-cases `'/'` to an exact-match
comparison so it only exempts the root path itself, while every other entry
in `publicPaths` keeps its existing prefix-match behavior.

Result: unauthenticated visitors now see the landing page at `/` without
being bounced to `/login`; authenticated visitors are still redirected to
`/dashboard` (both by `page.tsx`'s own check and, redundantly but harmlessly,
by middleware's second rule which only touches `/login` and `/register`).
Every other route's auth gating is unchanged.

## TypeScript output (after the middleware fix)

```
$ cd skillswap && npx tsc --noEmit
(no output)
$ echo $?
0
```

Clean — zero TypeScript errors.

## Stopping here, as instructed.
