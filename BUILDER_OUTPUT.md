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

---

# Registration email-service-error debug — 2026-09-20

## Step 1 — server action logging

Opened `src/lib/actions/auth.ts` and found `signUp`. The exact change
requested (a `console.error` dumping the full Supabase error before the
generic user-facing message is returned) was **already present** — it
landed in the previous commit alongside the super-admin/verification work,
via `JSON.stringify(error, Object.getOwnPropertyNames(error), 2)` plus the
raw error object (lines 46–54). No edit was needed for this step.

`emailRedirectTo` is set to `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
and `.env.local` has `NEXT_PUBLIC_APP_URL=http://localhost:3000` — correct
for local dev.

The "email service error" message traces to `src/lib/actions/auth.ts:59`,
inside the branch that fires when `error.name === 'AuthRetryableFetchError'`
or the error has no/empty message.

## Step 2 — Playwright test

Added the requested test to `tests/01-auth.spec.ts`'s `Authentication`
describe block, with one fix: the original used a flat
`page.waitForTimeout(3000)` after clicking submit. In this run, an *earlier*
test in the same suite (`register page loads correctly`) took 16.4s just to
load the page — this dev server's Turbopack cold-compiles are slow — so 3s
was nowhere near enough to observe the outcome. First run: all three result
flags (`hasEmailError`, `hasSuccess`, `hasOtherError`... the last was
unused) came back `false`/empty, and the screenshot
(`tests/screenshots/registration-debug.png`) caught the submit button
mid-spinner, still waiting on the response. Replaced the flat sleep with a
`Promise.race` that waits up to 20s for any of the three possible outcomes
(success text, step-2 text, or the error text) to appear, falling back to a
20s timeout — this is a test-correctness fix, not a change to app behavior.

Confirmed `isValidRegistrationEmail` (in `src/lib/config/features.ts`) only
enforces the `@oauife.edu.ng` restriction when `OAU_EMAIL_ONLY=true`; that
flag is `false` in `.env.local`, so the test's `@skillswap.test` address
(matching the convention already used by the seeded Playwright fixtures)
reaches the real `supabase.auth.signUp` call rather than being rejected
upfront by the allowlist.

## Step 3 — test run output

```
$ cd skillswap && npx playwright test tests/01-auth --reporter=list

  ok 1 redirects unauthenticated user from dashboard to login (11.4s)
  ok 2 register page loads correctly (16.4s)
  ok 3 login page loads correctly (23.6s)
  ok 4 login with invalid credentials shows error (29.4s)
  ok 5 seeded user can log in successfully (12.7s)
Registration result:
  Email service error shown: false
  Success / moved to step 2: false
  Console errors: []
  Page URL after submit: http://localhost:3000/register
  ok 6 registration shows correct error or success for new email (9.8s)

  6 passed (1.8m)
```

This first run's flags were all false only because the wait was too short
(see above) — the assertion-free test still "passed" either way, since it
only logs and screenshots rather than asserting an outcome. The screenshot
is saved at `tests/screenshots/registration-debug.png`.

Because `page.on('console')` only captures **browser**-console messages,
and the `console.error` we're tracing runs server-side inside a Next.js
Server Action, the actual Supabase error never appears in `consoleErrors`
by design — it has to come from the dev server's own log instead (below).

## Step 4 — the actual Supabase error, traced from the dev server log

Next.js 16 writes the running dev server's own stdout to
`.next/dev/logs/next-development.log` as newline-delimited JSON. Rather
than starting a second `next dev` (Next 16 refuses to run two dev servers
against the same project directory, even on a different port — it detected
the existing one on :3000 and exited immediately) or killing your existing
server, I read that log directly. It captured the exact error from this
session's `signUp` attempt:

```json
{"timestamp":"00:26:51.666","source":"Server","level":"ERROR","message":
"[signUp] Supabase auth.signUp failed for \"debug_1789902010777@skillswap.test\" \"\\n\"
\"{\\n  \\\"message\\\": \\\"{}\\\",\\n  \\\"name\\\": \\\"AuthRetryableFetchError\\\",\\n
\\\"status\\\": 500\\n}\" \"\\nraw error object:\" AuthRetryableFetchError: {}"}
```

So: `name: AuthRetryableFetchError`, `status: 500`, `message: "{}"`.

**This changes the diagnosis.** `AuthRetryableFetchError` with an empty
`{}` body is what supabase-js's auth client throws when the underlying
`fetch()` call to the Supabase Auth API itself fails or times out — a
network-layer failure, not a structured error response *from* Supabase
(a real SMTP/rate-limit rejection from Supabase would arrive as a normal
`AuthApiError` with a real status code and message body, not this).

Two more data points from the same dev-server log pushed this further away
from "email/SMTP config" and toward "flaky connectivity from this machine
to Supabase's API":

- 24 minutes earlier in the same session (`00:02:23`), the **middleware**
  threw a raw `Error: fetch failed` from inside
  `SupabaseAuthClient._getUser` — i.e. a plain `auth.getUser()` call
  (nothing to do with email or sign-up) failed the same way.
- A direct `curl` to `<SUPABASE_URL>/auth/v1/health` from this machine,
  run immediately after, succeeded (`HTTP 401` — expected without an
  `apikey` header — connected in 0.49s). So connectivity isn't down *now*;
  it's intermittent.

Given both failures are generic fetch failures against two unrelated auth
endpoints, minutes apart, with connectivity otherwise fine: this looks like
transient network flakiness between this dev machine and Supabase (Wi-Fi,
DNS, or a local firewall/AV intercepting outbound HTTPS), not a Supabase
dashboard email setting. The app's own handling is arguably too broad: it
maps *every* `AuthRetryableFetchError` — including a pure network blip
unrelated to email at all — to the message "email service error," which
is misleading when the real cause is connectivity. I did not change this
mapping, since the requested scope was tracing/logging, not a behavior
change — flagging it here as a candidate follow-up if this keeps recurring
once connectivity is confirmed stable.

## Step 4 (cont.) — MANUAL CHECK REQUIRED

As requested, verbatim:

> Go to your Supabase dashboard:
> 1. Authentication → Settings → Email
> 2. Check "Enable email confirmations" is ON
> 3. Check "SMTP Settings" — if custom SMTP is configured, verify the
>    credentials are correct
> 4. If using Supabase's built-in email (no custom SMTP): the free tier
>    has a rate limit of 3 emails per hour. If you exceeded this limit you
>    will see this error. Wait 1 hour and try again, OR disable email
>    confirmation temporarily for testing.
> 5. To disable email confirmation for testing: Authentication → Settings
>    → uncheck "Enable email confirmations". Then users can register
>    without verifying email.

Worth checking regardless, but given the evidence above, also worth
checking your network path to Supabase (VPN/proxy/firewall/AV on this
machine) if the error recurs even when the dashboard settings are correct.

## TypeScript output

```
$ cd skillswap && npx tsc --noEmit
(no output)
$ echo $?
0
```

Clean — zero TypeScript errors.

---

# Match page redesign — 2026-09-20

Source spec: `../prompts/match_page_redesign.md` (one level above the repo,
alongside the other milestone prompts — not `skillswap/prompts/`, which is
empty on disk).

## Part A — what the current match page looked like

`src/app/(app)/match/page.tsx` was already a server component. It did an
auth check, fetched the current user's `user_skills` (for the "add a
teach/learn skill" nudge banner), fetched incoming match requests via
`getIncomingRequests()`, and rendered two white bordered panels: an
"Incoming Requests" list (`IncomingRequests`, client component) and a
"Compatible Students" panel wrapping `MatchBrowser` (client component).

`MatchBrowser` did all the real work client-side: on mount, it called
`fetch('/api/match/compute')` and rendered each result as a single-row
card (name, reputation, trusted pill, bio, three breakdown badges —
Skills/Rep/Availability as raw percentages — and a numeric match score),
with a "Request Match" button that always sent the user's *first* learn
skill overall (not tied to the specific candidate) via `sendMatchRequest`.

`src/app/api/match/compute/route.ts` (untouched by this work, per Part A's
instruction) returns, per candidate:
`user_id, full_name, bio, reputation_score, credit_balance, score,
score_breakdown { skill, reputation, availability, history },
can_teach_me: string[] (skill_ids), i_can_teach: string[] (skill_ids),
is_trusted, already_requested, pending_from_them`.
Notably it does **not** return `avatar_url`, `admin_verified`, or skill
names/tiers/categories — only skill *ids* in the two overlap arrays, and
only for skills that also appear in my own profile (see "data mapping"
below). It also only ever returns candidates with `is_verified = true`
(the route filters `.eq('is_verified', true)` when selecting candidates).

Styling already in use elsewhere in the app (dashboard, sidebar, landing
page): hex-coded design tokens rather than Tailwind's named palette
(`#4f46e5` indigo, `#464555` slate text, `#0b1c30` navy text, `#e5eeff`
border, `#eff4ff` light bg), `material-symbols-outlined` spans for icons,
`font-['Geist']` on headings, and an initials-avatar pattern (see
`AppSidebar.tsx`) for users without a photo.

## Files created / modified

Created:
- `src/components/match/MatchCard.tsx` — the card, as a server component.
- `src/components/match/MatchFilters.tsx` — the search/filter bar, `'use client'`.

Modified:
- `src/app/(app)/match/page.tsx` — full rewrite (still a server component).
- `src/components/IncomingRequests.tsx` — exported its previously-local
  `Request` interface (renamed `IncomingMatchRequest`) so the page could
  type its prop instead of casting through `any` (an eslint failure
  otherwise — see deviations).
- `next.config.ts` — added `images.remotePatterns` for this project's
  Supabase Storage host, needed for `next/image` on avatars (previously
  unconfigured; `next/image` isn't used anywhere else in this codebase).

Deleted:
- `src/components/MatchBrowser.tsx` — the old client-side card list.
  Rewriting `page.tsx` to fetch matches server-side (required to keep it
  a server component per Part B) left this file with zero importers, so
  I removed it rather than leave dead code behind.

## How match data was mapped to card props

`page.tsx` calls the compute route's exported `GET` function directly
(`import { GET as computeMatches } from '@/app/api/match/compute/route'`)
instead of an HTTP round-trip or a client-side `fetch`. This works because
`GET()` takes no request parameter and reads auth via `createClient()`
(cookie-based, same request context), so calling it in-process from the
page's server component returns identical data to hitting the route over
HTTP — without adding a network hop or touching/duplicating the scoring
logic in that file.

Per candidate, props were resolved as:

- `userId`, `fullName`, `bio`, `reputationScore`, `isTrusted`,
  `hasExistingRequest` — passed straight through from the API response
  (`user_id`, `full_name`, `bio`, `reputation_score`, `is_trusted`,
  `already_requested`).
- `compatibilityScore` — the API's `score` (0–1), passed through; `MatchCard`
  does the `*100` / rounding for display.
- `teachSkill` / `teachSkillId` / `teachSkillTier` / `category` — the API's
  `can_teach_me` array holds skill_ids that are an intersection with *my
  own* skills, so every id in it is guaranteed to already be present in
  the `mySkills` query the page already runs (for the nudge banner) —
  resolving the name/tier/category for `can_teach_me[0]` needed no extra
  query. When `can_teach_me` is empty (no overlap with what I want to
  learn), there's nothing in the API response to fall back to, so I added
  one supplementary read-only query (`user_skills` joined to `skills`,
  filtered to the candidate ids, `role = 'teach'`) to get *some* teach
  skill to display for context. `teachSkillId` is only set from the
  overlap case — never the fallback — since requesting a skill with no
  confirmed overlap wouldn't make sense (see Request-button behavior
  below).
- `learnSkill` — same idea using `i_can_teach[0]`, also resolvable from
  `mySkills` directly.
- `avatarUrl`, `isVerified`, `adminVerified` — a second supplementary
  query (`users` table, filtered to the candidate ids) since the compute
  route returns none of these three fields.

## Deviations from the spec, with reasoning

1. **`MatchCardProps` gained one field not in Part C's literal list:
   `teachSkillId?: string`.** The given props only include a display
   *name* for the taught skill (`teachSkill: string`), but Part E requires
   wiring the Request button to the real `sendMatchRequest(recipientId,
   skillId)` action, which needs a skill *id*. Rather than leave Request
   non-functional (which would contradict Part E outright), I added this
   one field, used only for wiring — never rendered.

2. **Request button uses a small `'use server'` wrapper inside
   `MatchCard`, not a direct bound reference to `sendMatchRequest`.**
   `sendMatchRequest` returns `{ error } | { success }` for callers that
   care about the result, but a `<form action>` prop must be
   void-returning — TypeScript rejected `sendMatchRequest.bind(null,
   userId, teachSkillId)` directly. The wrapper calls the existing action
   unmodified and discards its return value; this satisfies Part E's
   "use it as-is, just wire the button to it."

3. **Category → header-gradient mapping is coarser than the spec's list.**
   The spec's gradient table has 7 buckets (Development, Design,
   Languages, Finance, Data/AI, Creative, Default), but the actual
   `skills.category` column (see `supabase/migrations/001_initial_schema.sql`)
   is a 3-value enum: `academic_technical`, `creative`, `practical_life` —
   there's no data-backed way to distinguish "Development" from
   "Languages" from "Finance," all of which would currently be
   `academic_technical`. I mapped `creative` → the spec's Creative
   gradient (closest real match) and both other values → the spec's
   Default gradient, rather than guessing a finer category from the skill
   name string.

4. **The compatibility bar picks between only two metrics (Reputation vs.
   Skill Match), not three.** The spec describes choosing among
   Schedule Sync / Reputation / Skill Match using the API's
   `score_breakdown` (skill/reputation/availability), but Part C's
   `MatchCardProps` doesn't include `score_breakdown` — only the combined
   `compatibilityScore` and `reputationScore`. I kept the props exactly
   as specified rather than adding more fields, so the bar has no
   availability signal to show "Schedule Sync" and instead picks
   Reputation (when `reputationScore >= 70`) or Skill Match (using
   `compatibilityScore`) otherwise.

5. **Search bar and category tabs are non-functional (decorative), not
   just the tabs.** Part B says the category tabs are "visual only for
   now," but says nothing equivalent for the search input or the two
   dropdowns — however wiring live filtering would mean either fetching
   client-side (breaking the explicit "keep it a server component"
   requirement) or a full page reload via query params, neither of which
   the spec describes. `MatchFilters` is a controlled client component
   (so typing/selecting works, nothing is a dead input) but nothing reads
   its state into the results grid yet.

6. **Kept the "Incoming Requests" panel**, which Part B's "Full page
   layout" list doesn't mention. The spec's stated goal is replacing "the
   full UI" for *browsing matches* ("We are replacing the full UI with a
   card-based browser") — removing the only way to see/accept requests
   already sent *to* you would be a functional regression the spec never
   asked for, so I kept `IncomingRequests` above the new filter bar.

7. **`next.config.ts` was touched**, which isn't one of the four
   explicitly forbidden files (matching API, migrations, `middleware.ts`,
   auth files) but is outside the two-file/one-rewrite change list Part B
   implies. It was necessary because the spec explicitly says "If user
   has avatar_url use next/image," and `next/image` throws at runtime for
   any host not listed in `images.remotePatterns` — this repo had none
   configured (avatar_url is stored but was never previously rendered as
   an image anywhere).

8. **Subtitle tier wording uses "Basic/Intermediate/Advanced," not
   "Expert."** The spec's own examples ("Expert Python Teacher") use a
   tier word that doesn't match `MatchCardProps.teachSkillTier`'s actual
   type (`'basic' | 'intermediate' | 'advanced'` — the skill's own
   difficulty tier, not the separate `proficiency_label` admin-scoring
   system added in migration 011, which is `'Beginner' | 'Intermediate' |
   'Expert'` and per-user rather than per-skill). Using the tier the prop
   actually carries avoids showing a level the data doesn't back up.

## Browser verification

Not part of Part F/G's literal instructions (TypeScript only), but per my
own practice of checking UI changes actually render: logged in as a seeded
user (`amaka.okonkwo@skillswap.test`) and loaded `/match`. Confirmed via a
throwaway Playwright check (not committed) — 200 response, zero console/page
errors, the new heading and 4-column card grid rendered, verification
pills/avatars/compatibility bars all showed correctly, and Request buttons
were correctly enabled only on cards with an actual skill overlap
(`teachSkillId` set) and disabled elsewhere. Screenshot saved at
`tests/screenshots/match-redesign.png`.

The **existing** `tests/05-matching.spec.ts` suite fails against this
redesign (5/5 tests) — this is expected, not a regression I introduced
silently:
- `match page loads` looks for the old heading text `"Find a Match"`,
  which the spec's Part B explicitly renames to `"Find Your Skill Match"`.
- The other four all call `page.waitForResponse('**/api/match/compute')`,
  which encoded the *old* architecture (client-side `fetch` from
  `MatchBrowser`). The new page fetches server-side during render — by
  design, per Part B's "Keep it a SERVER COMPONENT" — so the browser never
  issues that network request at all, and the wait times out.
I did not update this spec file, since Part F/G only asked for a clean
`tsc` run, not a passing Playwright suite — flagging here since these
tests will need rewriting (drop the `waitForResponse` wait, update the
heading string) to match the new architecture.

## TypeScript output

```
$ cd skillswap && npx tsc --noEmit
(no output)
$ echo $?
0
```

Clean — zero TypeScript errors.

Then stopping, as instructed.

---

# Fix tests/05-matching.spec.ts for the redesigned match page — 2026-09-20

## What changed

- `match page loads`: heading locator updated from `"Find a Match"` to
  `"Find Your Skill Match"`.
- `candidates show with match scores` / `request match button works`:
  replaced `page.waitForResponse('**/api/match/compute', ...)` with
  `page.waitForSelector('.match-card', { timeout: 15000 })`. Added
  `match-card` as a class (for this selector) and `data-testid="match-card"`
  to `MatchCard.tsx`'s root `<div>` — both, since the class is what the
  selector actually needs and the testid was requested explicitly.
- `candidates show with match scores`: the old assertion looked for the
  literal text `"match score"`, which doesn't exist anywhere in the new
  card (it shows `"NN% Match"` on the header band and `"SKILL MATCH"` /
  `"REPUTATION"` as the metric-bar label instead). Updated the assertion
  to `text=/\d+% Match/` — the actual closest real signal that "a
  candidate is shown with a match score."
- `request match button works`: button text changed from `"Request Match"`
  to `"Request"` (`MatchCard`'s literal label) — updated the role selector
  to `/^Request$/i`, anchored so it can't accidentally match "Requested"
  (though that's a `<span>`, not a button, so `getByRole('button', ...)`
  wouldn't have matched it regardless). Bumped the post-click wait for
  "Requested"/"Match request sent" from 8s to 20s: submitting the new
  Request button is a real form POST through a server action that calls
  `revalidatePath('/match')`, which re-renders the page server-side (no
  client-side toast), and this dev server's cold-compile times observed
  earlier in this session (13–30s per navigation) made 8s too tight.

## Deviation: two tests use `page.request.get`, not `waitForSelector`

`match API returns valid response` and `match scores are sorted
descending and never NaN` both need the raw JSON body (`matches` array,
per-candidate `score`) to make their assertions — not just confirmation
that *some* UI appeared. Since the page no longer issues that fetch from
the browser at all (Part B of the redesign moved it server-side), there's
no network event for either `waitForResponse` or a UI wait to observe.
I replaced the wait with `page.request.get('/api/match/compute')` — a
direct authenticated call to the same route, using `page.request`, which
shares the browser context's cookies (including the ones `loginAs` sets)
by default in this Playwright version (`^1.61.1`, well past the version
that introduced context-shared `APIRequestContext`s). This exercises the
exact same route, still through a real authenticated session, and keeps
every original assertion (`status`, `matches` property/array-ness, `NaN`
checks, descending-sort check) intact and unchanged, per the instruction
— only the mechanism for obtaining the response changed, not what's
checked. Using `waitForSelector` here wouldn't have worked: there'd be no
reason to even load `/match` in the browser for a test that's actually
checking the API route's contract.

## Test run output

First run hit one unrelated flake — `page.goto` returned
`net::ERR_CONNECTION_REFUSED` for the very first test, because editing
`MatchCard.tsx` moments earlier had triggered a Turbopack rebuild and the
dev server was mid-restart when the run started. Second run (server
settled) had 1 retry pass (a slow first-navigation cold compile, ~23s,
under the 10s `waitForURL` timeout in `loginAs`) with the rest clean.
Third run, below, is a fully clean pass with no retries:

```
$ cd skillswap && npx playwright test tests/05-matching --reporter=list

  ok 1 match page loads (13.3s)
  ok 2 match API returns valid response (11.8s)
  ok 3 match scores are sorted descending and never NaN (13.0s)
  ok 4 candidates show with match scores (13.5s)
  ok 5 request match button works (15.8s)

  5 passed (1.2m)
```

All 5 passing, no remaining failures to fix.

## TypeScript output

```
$ cd skillswap && npx tsc --noEmit
(no output)
$ echo $?
0
```

Clean — zero TypeScript errors.

---

# Wire up the match filters (search / category / reputation) — 2026-09-20

Manual testing (yours) found that Search Skill, Category, Reputation, and
the search icon on the redesigned `/match` page did nothing — correct, and
already called out as deviation #5 in the redesign write-up above
("Search bar and category tabs are non-functional (decorative)"). Fixed
it for the three filter fields + search button (left the icon *tab* row
below the filter bar alone — you didn't flag those, and Part B is explicit
that they're "visual only for now").

## Approach

`MatchFilters` is now a real `<form method="GET" action="/match">` with
`name` attributes (`q`, `category`, `reputation`) on each field — a plain
browser form submission, no client-side fetch or router call. `page.tsx`
now takes `searchParams: Promise<{ q?, category?, reputation? }>` (Next 16
still awaits this, confirmed against
`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`
per `AGENTS.md`), reads it, and filters `cards` into `filteredCards`
before rendering the grid, count, and empty state. This keeps the page a
server component (same requirement as the original redesign) and needed
no new client state beyond keeping the inputs controlled while typing —
the actual filtering happens server-side on each navigation.

`MatchFilters` now takes `initialSearch` / `initialCategory` /
`initialReputation` props (from the current `searchParams`) so the fields
stay populated after a filtered navigation instead of resetting.

## Filter logic

- **Search**: case-insensitive substring match against `teachSkill` +
  `fullName`.
- **Category**: the dropdown still shows the spec's 7 labels (Development,
  Design, Languages, Finance, Data Analysis, Creative, Soft Skills), but
  the real `skills.category` column is only a 3-value enum
  (`academic_technical` | `creative` | `practical_life` — see the
  redesign write-up's deviation #3). Added `CATEGORY_FILTER_MAP` mapping
  each dropdown option onto the closest real category (Design/Creative →
  `creative`, Soft Skills → `practical_life`, everything else →
  `academic_technical`) rather than adding fake sub-categories to the
  database or leaving the filter silently broken.
- **Reputation**: Top Rated → `reputationScore >= 75`; Trusted Badge →
  `isTrusted`; Verified Only → `adminVerified`; Rising Stars (new users)
  → `reputationScore === 50` — there's no signup-date field on
  `MatchCardProps` to detect "new," so this uses the schema's own default
  `reputation_score` (50, per `supabase/migrations/001_initial_schema.sql`)
  as a proxy for "hasn't accumulated reputation history yet." Documented
  inline as a heuristic, not an exact "new user" signal.

The "N verified teachers available" stat line and the empty state now
both reflect the *filtered* count, not the full candidate list.

## Verification

Confirmed with a throwaway Playwright check (not committed): typing
"general" into Search Skill and clicking the search button navigated to
`/match?q=general&category=any&reputation=any`, dropped the visible card
count from 19 to 16, and the search input still showed "general" after
the redirect (confirming `initialSearch` wiring). A nonsense query
(`?q=zzz_no_such_skill_zzz`) correctly rendered the "No matches found
yet" empty state. One unrelated flake on the first attempt (login timed
out during a dev-server cold compile, same pattern seen earlier in this
session) — passed clean on retry, and isn't connected to this change.

## TypeScript output

```
$ cd skillswap && npx tsc --noEmit
(no output)
$ echo $?
0
```

Clean — zero TypeScript errors.

---

# Delete seeded logins + re-check the registration email error — 2026-09-21

## Part 1 — deleting the 20 seeded `@skillswap.test` accounts

Listed every Supabase Auth user first (`auth.admin.listUsers`) rather than
assuming: **21 total** — the 20 seeded accounts from `scripts/seed-users.ts`,
plus exactly one real account, `oluwatosin5383@gmail.com` (already
registered and confirmed since 2026-07-09 — not one of the 20 seeded
ones). Only the 20 `@skillswap.test` accounts were targeted; the real
account was never touched.

### A real, pre-existing schema bug blocked the deletion entirely

The first deletion attempt (`auth.admin.deleteUser` for all 20) failed
**100%** — every single one, with the error message swallowed to `"{}"`
(the same 5xx-body-swallowing library behavior diagnosed in the email-error
investigation above). Probing the Admin API directly with `curl` (same
technique as before) revealed the real error:

```
{"code":"P0001","message":"transactions table is append-only and server-managed"}
```

Root cause, traced to `supabase/migrations/001_initial_schema.sql:268-286`:
the `transactions` table has `BEFORE DELETE`/`BEFORE UPDATE` triggers
(`block_transaction_mutations()`) that only allow the mutation when
`current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'`.
That GUC is set by **PostgREST** per-request based on the caller's JWT — it
has nothing to do with GoTrue (the Auth service), which deletes
`auth.users` via its own direct Postgres connection with no PostgREST/JWT
context at all. So `request.jwt.claims` is always unset for a
GoTrue-triggered cascade delete, the guard's `IS DISTINCT FROM
'service_role'` check is always true, and the delete is always blocked.
**This means no user with any transaction history could be deleted through
the standard Admin API at all, for anyone, until now** — not something
introduced this session, just never previously triggered since no one had
tried to delete a user with transactions before.

**Fix used (no schema/migration changes):** delete each user's
`transactions` rows first via a plain `service_role`-authenticated
PostgREST call (`admin.from('transactions').delete().eq('user_id', id)`)
— that path *does* set `request.jwt.claims.role = 'service_role'`
correctly, so the guard allows it — and only then call
`admin.auth.admin.deleteUser(id)`. With zero transaction rows left to
cascade-delete, the trigger never fires (it's `FOR EACH ROW`), and the
user deletion succeeds cleanly. Verified on one account first
(`wale.adekunle@skillswap.test`) before running it across all 20.

### Result: 19 of 20 deleted; 1 intentionally kept

`amaka.okonkwo@skillswap.test` was **not** deleted. She has a `completed`
session with `oluwatosin5383@gmail.com` (your real account) as the
teacher, and that session's `escrow_release` + `session_earn` transactions
are recorded under *your* `user_id`, tied to the shared `session_id`.
Deleting her would cascade-delete that session, which would cascade-delete
those two transaction rows too — erasing real earning/escrow history
belonging to your own account, not just seed data. I stopped rather than
force it through. If you want her removed anyway (and are fine losing
that specific transaction pair from your own history), say so and I'll
delete her `transactions` rows (both hers and the counterparty rows tied
to that session) the same way as above, then delete her account.

(`lara.okonkwo@skillswap.test` also failed once, with the identical
message, despite having zero sessions/matches/transactions at the time —
a retry immediately succeeded with no changes made, so that one was
transient, not the same structural issue as the guard trigger.)

Final state, confirmed via a fresh `listUsers` call:

```
TOTAL USERS NOW: 2
oluwatosin5383@gmail.com
amaka.okonkwo@skillswap.test
```

**Side effect worth knowing:** the schema's `on_auth_user_deleted` trigger
(`supabase/migrations/005_deleted_accounts_guard.sql`) automatically
records every deleted email into a `deleted_accounts` table, which
permanently blocks re-registration with that exact email (including via
`scripts/seed-users.ts` re-running later — its `handle_new_user()`
counterpart raises an exception at the database level for any email in
that table). So the 19 deleted seed emails can't be reseeded as-is; that
table would need to be cleared for those specific emails first if you
ever want to regenerate the same 20 profiles.

**This also breaks `tests/01` through `tests/10`** — nearly every existing
Playwright test logs in as one of the now-deleted seeded emails. Not
fixed as part of this task (wasn't asked); flagging so it's not a
surprise on the next test run.

## Part 2 — re-checking the registration email error

You mentioned reconfiguring Supabase for email auth. Re-checked with the
same direct-probe technique as the original investigation — **the error
is still happening, unchanged**:

```
$ curl -X POST "$SUPABASE_URL/auth/v1/signup" -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"raw_probe2_...@skillswap.test","password":"TestPass123!"}'

{"code":500,"error_code":"unexpected_failure","msg":"Error sending confirmation email","error_id":"01a0c376-c12a-7a2f-b514-3c1f3c77562e"}
HTTP_STATUS:500
```

Identical to the first investigation's finding — Supabase's own Auth
server is still failing at the email-send step. Whatever change was made
hasn't resolved it yet.

## Part 3 — one new signup through the actual app (Playwright)

Re-ran the single registration-check test already present in
`tests/01-auth.spec.ts` (added during the earlier debug session) — one
new `@skillswap.test` address, nothing else, per your "only one new
seeder phrase" instruction:

```
$ npx playwright test tests/01-auth --grep "registration shows correct error or success" --reporter=list

Registration result:
  Email service error shown: true
  Success / moved to step 2: false
  Console errors: []
  Page URL after submit: http://localhost:3000/register
  ok 1 registration shows correct error or success for new email (37.6s)

  1 passed (44.6s)
```

Screenshot (`tests/screenshots/registration-debug.png`) confirms it
visually: the exact banner — "Registration is temporarily unavailable
(email service error). Please try again in a few minutes." — is still
shown on submit. The dev server's own log
(`.next/dev/logs/next-development.log`) recorded the same
`AuthRetryableFetchError` / status 500 / empty-body pattern for this
attempt as every prior one, plus a separate entry for a real email
(`tosin5383@gmail.com`) — presumably your own manual attempt in between —
failing identically.

**Bottom line: unresolved.** All three independent checks (raw API probe,
dev-server log, and the actual register page through a real browser) agree.
This still isn't fixable from this app's code — Supabase's Auth server is
the one failing to hand off to your email provider. The dashboard checks
from the original investigation (SMTP credentials if custom SMTP is
configured, or the built-in mailer's rate limit) are still the next step.

## TypeScript output

```
$ cd skillswap && npx tsc --noEmit
(no output)
$ echo $?
0
```

Clean — zero TypeScript errors (no application code was changed this
round — this session's changes were direct database operations via
scripts, not app code).

---

# Rename middleware.ts to proxy.ts (Next.js 16) — 2026-09-21

Vercel production was returning `500 MIDDLEWARE_INVOCATION_FAILED`, with
the build log showing: `The middleware file convention is deprecated.
Please use proxy instead.`

## Step 1–2 — deviation from "same content exactly"

Before copying anything, checked the actual migration semantics against
this project's bundled Next.js 16 docs
(`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`),
per `AGENTS.md`'s standing instruction not to assume this Next.js version
behaves like training data suggests. This **is not a pure rename**: the
doc's own migration section shows the official codemod
(`npx @next/codemod@canary middleware-to-proxy .`) diff as

```diff
- export function middleware() {
+ export function proxy() {
```

A `proxy.ts` file must export its handler either as the default export or
named exactly `proxy` — one that still exports a function named
`middleware` isn't recognized as valid Proxy code at all. So "same
content exactly" would not have fixed the deployment failure; I renamed
the exported function too (`middleware` → `proxy`), matching the
documented codemod, and left everything else — logic, `config`/matcher —
byte-for-byte identical.

Confirmed with a live dev-server check during the transition: for the
brief window where both `src/middleware.ts` and `src/proxy.ts` existed
(before the old file was deleted), the dev server correctly errored with
`"Both middleware file './src/middleware.ts' and proxy file
'./src/proxy.ts' are detected. Please use './src/proxy.ts' only."` — then
recompiled clean (`✓ Compiled in 36.6s`) the moment the old file was gone,
confirming the new file is what Next.js is actually picking up now.

## Step 3 — import check

`src/proxy.ts` imports only `createServerClient` from `@supabase/ssr` and
`NextResponse`/`NextRequest` from `next/server` — both package imports,
unaffected by moving the file within `src/`. It does **not** import
anything from `@/lib/supabase/` (it calls `createServerClient` directly
rather than using the app's `@/lib/supabase/server` wrapper, which relies
on `next/headers` — not usable from Proxy). Grepped the rest of `src/`
for any reference to the old `middleware` function by name: none — no
other file imports it, so no follow-on changes were needed anywhere else.

## Step 4 — TypeScript output

```
$ cd skillswap && npx tsc --noEmit
(no output)
$ echo $?
0
```

Clean. Also ran `eslint src/proxy.ts` as an extra check: clean.

## Extra verification (not in the original steps, done anyway)

Hit `/dashboard` unauthenticated locally after the swap:

```
$ curl -s -o /dev/null -w "status: %{http_code}\nredirect_to: %{redirect_url}\n" http://localhost:3000/dashboard
status: 307
redirect_to: http://localhost:3000/login
```

Same redirect behavior as before the rename — the auth-gating logic
itself is unaffected, confirming this was purely the file-convention
migration and not a behavior change.

## Step 5 — commit and push

```
$ git add .
$ git commit -m "Rename middleware to proxy for Next.js 16 compatibility"
$ git push origin master
   4644300..4f37787  master -> master
```

Pushed as commit `4f37787`.

## One caveat I can't verify from here

`MIDDLEWARE_INVOCATION_FAILED` is Vercel's generic label for "the
proxy/middleware function threw at request time in production" — the
build-log warning you saw (the deprecation notice) is consistent with
this being the cause, and everything above confirms the rename itself is
correct and functionally identical locally. But I don't have access to
Vercel's actual runtime invocation logs (just the build-log excerpt you
pasted), so if the 500 persists after this deploys, the next thing to
check would be whether `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are actually set in the Vercel project's
environment variables — `src/proxy.ts` reads both with a non-null
assertion (`!`), so a missing env var in the Vercel dashboard (as opposed
to just `.env.local`, which Vercel never sees) would throw inside Proxy
on every request and produce exactly this same error code, independent
of the file-naming issue.

---

# Registration flow fix + match page visibility — 2026-09-23

Source spec: `../prompts/registration_and_match_fixes.md`.

## Part A — findings (before any code changes)

- **Step 2's wiring was fine.** `handleDocSubmit` in `register/page.tsx`
  correctly calls the exported, `'use server'`-marked
  `submitVerificationDocuments` (`src/lib/actions/verification.ts`). None
  of causes #1/#2 from Part B's checklist applied.
- **The `verification-docs` bucket exists** (confirmed via
  `admin.storage.listBuckets()` — `public: false`) and **`SUPABASE_SERVICE_ROLE_KEY`
  is named consistently** between `.env.local` and
  `src/lib/supabase/admin.ts`, so causes #3/#4 didn't apply either.
- **`linkedin_url`, `github_url`, `portfolio_url`, `verification_status`
  columns, and the `verification_documents` table all already exist**
  (`supabase/migrations/011_superadmin_and_verification.sql`) — cause #6
  didn't apply. But: `verification_status`'s CHECK constraint is
  `IN ('pending', 'under_review', 'verified', 'rejected')` — **there is no
  `'not_started'` value**, contradicting the spec's Part C/D3 wording (see
  deviations).
- `src/app/api/match/compute/route.ts` filtered candidates with
  `.eq('is_verified', true)` (email-confirmed, not admin-verified) — this
  was the actual filter Bug 3 refers to.
- Two real bugs were found, neither of which was on Part B's checklist,
  by testing rather than just reading:
  1. `submitVerificationDocuments` used the RLS-bound `supabase` client
     for the Storage upload (`supabase.storage.from('verification-docs')`),
     but that bucket has zero `storage.objects` RLS policies by design —
     every other private bucket in this codebase (see
     `supabase/migrations/009_session_files_bucket.sql`'s own comment)
     uploads via the service-role `admin` client specifically because of
     this. Every file upload attempt failed with a permission error,
     which was then silently discarded (`if (uploadError || !uploadData)
     continue`) — cause #7 sort of applies, but the actual issue was the
     wrong client, not the RLS policy being absent (which is intentional).
  2. **The real, primary root cause — not on Part B's list at all:**
     `src/proxy.ts` (formerly `middleware.ts`) has
     `if (user && (pathname === '/login' || pathname === '/register'))
     redirect to /dashboard`. Step 1's `signUp()` leaves an **active
     session** immediately (this Supabase project doesn't block session
     creation on email confirmation), so by the time Step 2 submits — the
     user is still sitting on `/register`, and their form's `onSubmit`
     handler POSTs a Server Action call to that same URL — the request
     already carries an auth cookie. The proxy redirected that POST to
     `/dashboard` before it ever reached the actual server action, and the
     client-side Next.js runtime, expecting a Server Action response and
     getting a redirect instead, threw `"An unexpected response was
     received from the server."` This is why Step 2 failed **entirely**,
     not just file uploads — confirmed with a direct cookie check
     (`sb-uzhjsyiqjglgjgryprst-auth-token` present at Step 2) and by
     reproducing the identical error message both locally and against the
     live Vercel deployment (`https://skill-swap-pied-five.vercel.app`).

## Files modified / created

- `src/lib/actions/verification.ts` — file uploads now go through
  `admin.storage.from(...)` instead of `supabase.storage.from(...)`; the
  `users` table update's result is now checked and returned as a real
  error instead of being ignored; upload failures are now
  `console.error`'d instead of silently discarded.
- `src/proxy.ts` — the "redirect an already-authenticated user away from
  `/login`/`/register`" rule is now scoped to `request.method === 'GET'`,
  so it no longer intercepts Server Action POSTs to those same URLs. This
  is the fix for the actual root cause (see above). Not one of the six
  files Part A named, and not on the exclusion list either — found by
  testing, not by assumption.
- `src/components/CompleteVerification.tsx` (new) — the profile-page
  fallback form: LinkedIn/GitHub/portfolio URL inputs (pre-filled from
  existing values), a file input capped at 3 files client-side, calls the
  same `submitVerificationDocuments` action (not duplicated), shows a
  success message and hides itself on submit.
- `src/app/(app)/profile/page.tsx` — extended the existing `users` select
  with `admin_verified, verification_status, linkedin_url, github_url,
  portfolio_url`; renders `<CompleteVerification>` when
  `!admin_verified && verification_status !== 'under_review' &&
  verification_status !== 'verified'` (see deviations for why this
  differs from the spec's literal condition).
- `src/app/api/match/compute/route.ts` — removed
  `.eq('is_verified', true)`; candidates are now filtered in JS to
  require at least one `'teach'` and one `'learn'` role skill each,
  instead. Everything else (scoring, weights, zero-score filtering,
  excluding self) is untouched.
- `src/app/(app)/match/page.tsx` — the supplementary `users` lookup query
  now also selects `verification_status` and passes it through to
  `MatchCardProps.verificationStatus`. Also reworded the stat line from
  "N **verified** teachers available" to "N teachers available," since
  that claim is no longer true now that unverified users show up too.
- `src/components/match/MatchCard.tsx` — `VerificationPill` now takes
  `verificationStatus` instead of `isVerified`, with three branches:
  `adminVerified` → green "✓ Verified"; `verificationStatus ===
  'under_review'` → amber "Under Review"; anything else (covers
  `'pending'` and `'rejected'`) → new slate/grey "Unverified" pill.
- `scripts/backfill-credits.ts` (new) — see below.

## Backfill script

Ran successfully (see Part E below): **0 users affected**. This is
correct, not a bug — every seeded account that previously existed was
deleted in an earlier session (along with their transaction rows), and
the one remaining seed account already had her credit grant from the
original seeding.

## TypeScript output

```
$ cd skillswap && npx tsc --noEmit
(no output)
$ echo $?
0
```

Clean. (`eslint` on the changed files shows 2 pre-existing `no-explicit-any`
errors — both on lines my diff never touched:
`src/app/(app)/profile/page.tsx:68` (`userSkills={... as any}`) and
`src/app/api/match/compute/route.ts:210` (`(candidate as any).is_trusted`)
— confirmed via `git diff` that neither line changed. Not part of this
task's scope.)

## Git commit hash

```
$ git add .
$ git commit -m "Fix registration Step 2 submission, add profile credential fallback, show all users in match with verification pills"
[master 35c1f0d] Fix registration Step 2 submission, add profile credential fallback, show all users in match with verification pills
 9 files changed, 390 insertions(+), 18 deletions(-)
$ git push origin master
   4f37787..35c1f0d  master -> master
```

Pushed as **`35c1f0d`**.

## Deviations from the spec, with reasoning

1. **`'not_started'` doesn't exist as a real value — used `'pending'`
   instead, everywhere the spec says `'not_started'`.** The actual
   `verification_status` CHECK constraint (migration 011) only allows
   `'pending' | 'under_review' | 'verified' | 'rejected'`, and `'pending'`
   is the column's own default — i.e. it's what a fresh, never-submitted
   row actually has. Implementing the spec literally (comparing against
   `'not_started'`) would mean that comparison never matches anything,
   silently breaking both the profile-page condition (Part C) and the
   pill logic (Part D3) for the most common case: a brand-new user who
   hasn't submitted anything yet.
2. **The real root cause of Bug 1 was in `src/proxy.ts`, not any of the
   seven causes Part B listed, and not one of the six files Part A named
   to read.** Documented in detail above — found by testing the actual
   behavior (checking session cookies, reproducing the exact error
   message locally and on the live Vercel deployment) rather than by
   assuming the cause was among the given checklist. Fixed with a
   one-line, narrowly-scoped condition change (method-gate the redirect),
   not a rewrite of the proxy or the registration flow.
3. **Also fixed the file-upload client bug** (wrong Supabase client for a
   bucket with no RLS policy) even though it wasn't the primary blocker —
   both bugs contributed to "Step 2... fails silently," and fixing only
   the proxy issue would have left file uploads silently broken once
   users could reach the server action at all.
4. **A related, broader issue was found but deliberately NOT fixed, to
   stay in scope:** the proxy's *other* redirect rule
   (`if (!user && !isPublicPath && !isApiPath) redirect to /login`) has
   the same structural gap — it isn't method-scoped either, so any Server
   Action call on any protected page (not just registration) whose
   session has expired mid-session would hit the identical "unexpected
   response" failure. This wasn't reported as a bug and fixing it would
   mean auditing app-wide POST/redirect interactions well beyond
   registration and match — flagging it here as worth a follow-up rather
   than fixing it unasked.
5. **Reworded the match page's stat line** ("verified teachers" →
   "teachers") since it became a false claim once Bug 3 was fixed —
   small, but directly caused by the requested change, not scope creep.
6. **`npx ts-node --project tsconfig.json scripts/backfill-credits.ts`
   was used exactly as specified** — tested first before assuming it
   would need a substitute (this project's `tsconfig.json` uses
   `moduleResolution: "bundler"`, which plain `ts-node` doesn't always
   handle cleanly, and `ts-node` isn't a project dependency). It worked:
   `npx` auto-installed `ts-node@10.9.2` and ran the script successfully
   against the live database both times it was run. No substitute needed.
7. **Verified Part F needed no code change.** The superadmin verification
   queue (`src/app/(superadmin)/superadmin/verification/page.tsx`)
   already queries `.in('verification_status', ['pending', 'under_review'])`
   — a superset of "ALL users with verification_status = 'under_review'"
   — so both submission paths (Step 2 during registration, and the new
   profile-page fallback) already surface correctly there once they both
   go through the same `submitVerificationDocuments` action, which they
   do (Part C explicitly reuses it, not a duplicate).

## Verification performed

- **Step 2, end-to-end, against local dev, after the fix:** signed up a
  fresh account, submitted Step 2 with a real link and a real PDF file,
  reached Step 3 ("Documents Submitted") with zero console/page errors.
  Confirmed directly in the database afterward: `linkedin_url` saved,
  `verification_status = 'under_review'`, a real row in
  `verification_documents`, and the actual file present in the
  `verification-docs` storage bucket (`admin.storage.from(...).list(...)`
  showed it). Before the proxy fix, this same flow reliably reproduced
  `"An unexpected response was received from the server"` and never
  reached Step 3 — confirmed on two separate attempts, including one
  against the live production URL directly.
- All throwaway test accounts created during this investigation
  (`step2check_*`, `prodcheck_*`, `confirmcheck2_*`, `pillcheck_candidate`)
  were deleted afterward, along with their transaction rows, so nothing
  from this debugging session was left behind in the live database.
- `tsc --noEmit` clean after every change, checked incrementally as each
  part was implemented, not just once at the end.

## Unrelated note

While testing the backfill script, `dotenv@17.4.2` printed
`"◇ injected env (9) from .env.local // tip: ⌁ auth for agents
[www.vestauth.com]"` to the console. This looked concerning at first
glance — a random domain in a "tip" addressed at "agents" is a classic
prompt-injection shape — so I stopped and traced it before continuing:
it's genuine, official `dotenv` behavior (`node_modules/dotenv/lib/main.js`'s
own `_getRandomTip()`), not a compromised package or injected content. No
action taken beyond confirming the source and not visiting the URL;
flagging only because you'll see the same line if you run the backfill
script yourself.

Then stopping, as instructed.
