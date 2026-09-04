# Milestone 6 — AI Evaluation Pipeline — Builder Output

Source spec: `C:\Users\Oluwatosin\FinalYear\prompts\milestone6.md`
Executed against: `C:\Users\Oluwatosin\FinalYear\skillswap` (not a git repo — no version
control existed in this directory, so there is no commit/diff history to attach).

## What was built (Parts A–H)

- **Part A** — Appended `ASSEMBLYAI_API_KEY=YOUR_ASSEMBLYAI_API_KEY` and
  `OPENAI_API_KEY=YOUR_OPENAI_API_KEY` to both `.env.local` and `.env.local.example`.
  These are placeholders only — see Manual Steps below.
- **Part B** — `npm install assemblyai openai` — installed cleanly:
  `assemblyai@4.36.3`, `openai@6.48.0` added to `package.json` dependencies.
- **Part C** — Created `src/app/api/ai/evaluate/route.ts` (POST + GET), exactly as
  specified: idempotency guard, pending → transcribed → scored/failed state machine,
  GPT-4o-mini scoring call, transcript discarded (`transcript_text: null`) after
  scoring, 0.7×Peer + 0.3×AI reputation blend, `recompute_trusted_status` RPC call.
- **Part D** — Created `src/app/api/ai/transcribe/route.ts` (AssemblyAI batch
  transcription, returns a clear 503 + `demoMode: true` if the key isn't configured).
- **Part E** — Created `src/components/AIEvaluationPanel.tsx` (transcript input,
  5-dimension score bars, feedback report display, retry-on-failure UI).
- **Part F** — Wired `AIEvaluationPanel` into `src/components/SessionRoom.tsx`,
  rendered immediately after the peer-review section for completed sessions.
- **Part G** — Added the `aiEvaluations` query and "AI Teaching Scores" JSX section
  to `src/app/(app)/profile/[userId]/page.tsx`, placed between the learn-skills
  section and the action buttons, exactly as specified.
- **Part H** — Created `tests/09-ai-evaluation.spec.ts`, exactly as specified.

## Two deviations from the literal spec, and why

1. **RLS gap on the public-profile AI scores query (Part G).** The spec's query for
   `aiEvaluations` uses the regular authenticated Supabase client (`supabase`, not the
   admin client), matching the rest of that page. But the existing RLS policy
   `ai_eval_select_own` (migration 002) only lets a session's own teacher/learner (or
   an admin) `SELECT` `ai_evaluations` rows. Since the whole point of Part G is
   showing a teacher's aggregate AI scores to **any** visitor browsing their public
   profile, that policy would silently return zero rows for every viewer who wasn't
   personally in those specific sessions — the "AI Teaching Scores" section would
   simply never appear for anyone except the two people who did that session. I added
   `supabase/migrations/010_ai_eval_public_read.sql`, a new policy that publicly
   exposes only `status = 'scored'` rows (mirroring the already-fully-public
   `users_select_authenticated USING (true)` policy used for `reputation_score` and
   `is_trusted` on the same page). **This migration has not been run against the live
   database — I have no DB execution access in this project** (confirmed: no
   `supabase/config.toml`, no DB connection string anywhere in `.env.local`). You'll
   need to run it yourself in the Supabase SQL editor, same as the other numbered
   migrations in `supabase/migrations/`.

2. **Middleware fix — the two auth tests from Part H originally failed.** First
   Playwright run: 45/47 passed, 2 failed —
   `AI evaluate API requires authentication` and
   `AI transcribe API requires authentication`, both expecting HTTP 401 for an
   unauthenticated POST but getting 200. Root cause: `src/middleware.ts`'s
   `publicPaths` allowlist doesn't include `/api/*`, so an unauthenticated request to
   *any* API route is redirected (307) to `/login` before it ever reaches the route
   handler's own `if (!user) return 401` check — Playwright's request client follows
   the redirect and lands on the 200 OK login page. This is a pre-existing,
   site-wide gap (not something introduced by this milestone's new routes — both new
   routes' own auth checks are correct in isolation), and every *other*
   auth-protection test in the suite happens to always log in first, so this is the
   first time it was ever actually exercised. I fixed it with a narrow, three-line
   change to `middleware.ts`: API paths are now excluded from the
   anonymous-redirect branch, so they fall through to their own handler and return a
   real JSON 401/403 instead of an HTML redirect. Verified this introduces no
   regressions — reran the full 47-test suite afterward and all 47 passed (see below).
   `src/middleware.ts` was not on any forbidden-file list for this milestone.

## TypeScript check

Command: `npx tsc --noEmit` (run from `skillswap/`, after the middleware fix)

```
$ npx tsc --noEmit
EXIT_CODE=0
```

Zero type errors, exit code 0.

## Playwright test suite (final run, after the middleware fix)

Command: `npx playwright test --reporter=list` (against the project's existing
`next dev` server, Turbopack hot-reloaded all changes automatically)

```
Running 47 tests using 1 worker

  ok  1 [chromium] › tests\01-auth.spec.ts:4:7 › Authentication › redirects unauthenticated user from dashboard to login (9.8s)
  ok  2 [chromium] › tests\01-auth.spec.ts:9:7 › Authentication › register page loads correctly (9.6s)
  ok  3 [chromium] › tests\01-auth.spec.ts:17:7 › Authentication › login page loads correctly (6.6s)
  ok  4 [chromium] › tests\01-auth.spec.ts:22:7 › Authentication › login with invalid credentials shows error (5.1s)
  ok  5 [chromium] › tests\01-auth.spec.ts:30:7 › Authentication › seeded user can log in successfully (8.7s)
  ok  6 [chromium] › tests\02-dashboard.spec.ts:9:7 › Dashboard › shows credit balance (11.3s)
  ok  7 [chromium] › tests\02-dashboard.spec.ts:13:7 › Dashboard › shows reputation score (8.1s)
  ok  8 [chromium] › tests\02-dashboard.spec.ts:17:7 › Dashboard › has navigation links (11.0s)
  ok  9 [chromium] › tests\02-dashboard.spec.ts:22:7 › Dashboard › seeded user has 5 or more credits (8.1s)
  ok 10 [chromium] › tests\03-credits.spec.ts:9:7 › Credits Ledger › credits page loads (9.2s)
  ok 11 [chromium] › tests\03-credits.spec.ts:14:7 › Credits Ledger › shows starter credit transaction (8.5s)
  ok 12 [chromium] › tests\03-credits.spec.ts:19:7 › Credits Ledger › balance is never negative (8.1s)
  ok 13 [chromium] › tests\04-profile.spec.ts:10:7 › Profile › profile page loads (8.5s)
  ok 14 [chromium] › tests\04-profile.spec.ts:14:7 › Profile › skill selector shows available skills (10.2s)
  ok 15 [chromium] › tests\04-profile.spec.ts:22:7 › Profile › seeded user has teach skills listed (10.4s)
  ok 16 [chromium] › tests\04-profile.spec.ts:28:7 › Profile › bio textarea is editable (9.9s)
  ok 17 [chromium] › tests\05-matching.spec.ts:5:7 › Matching Engine › match page loads (12.4s)
  ok 18 [chromium] › tests\05-matching.spec.ts:11:7 › Matching Engine › match API returns valid response (13.2s)
  ok 19 [chromium] › tests\05-matching.spec.ts:22:7 › Matching Engine › match scores are sorted descending and never NaN (11.5s)
  ok 20 [chromium] › tests\05-matching.spec.ts:38:7 › Matching Engine › candidates show with match scores (13.6s)
  ok 21 [chromium] › tests\05-matching.spec.ts:45:7 › Matching Engine › request match button works (13.0s)
  ok 22 [chromium] › tests\06-escrow.spec.ts:5:7 › Escrow and Session Booking › sessions page loads (11.1s)
  ok 23 [chromium] › tests\06-escrow.spec.ts:11:7 › Escrow and Session Booking › sessions nav link is visible (9.3s)
  ok 24 [chromium] › tests\06-escrow.spec.ts:16:7 › Escrow and Session Booking › sessions page shows book session form when accepted matches exist (10.3s)
  ok 25 [chromium] › tests\06-escrow.spec.ts:26:7 › Escrow and Session Booking › credits page ledger shows correct transaction types (12.8s)
  ok 26 [chromium] › tests\06-escrow.spec.ts:35:7 › Escrow and Session Booking › ghost sweep API requires admin (9.0s)
  ok 27 [chromium] › tests\06-escrow.spec.ts:41:7 › Escrow and Session Booking › match API scores are between 0 and 1 (10.6s)
  ok 28 [chromium] › tests\07-profiles-and-chat.spec.ts:5:7 › Public Profiles and Session Room › public profile page loads for a seeded user (16.2s)
  ok 29 [chromium] › tests\07-profiles-and-chat.spec.ts:23:7 › Public Profiles and Session Room › own profile redirects to /profile (13.1s)
  ok 30 [chromium] › tests\07-profiles-and-chat.spec.ts:38:7 › Public Profiles and Session Room › match browser candidate names are clickable links (11.1s)
  ok 31 [chromium] › tests\07-profiles-and-chat.spec.ts:47:7 › Public Profiles and Session Room › sessions page shows enter session room link for active sessions (9.6s)
  ok 32 [chromium] › tests\07-profiles-and-chat.spec.ts:55:7 › Public Profiles and Session Room › ice config API returns valid config (9.0s)
  ok 33 [chromium] › tests\07-profiles-and-chat.spec.ts:65:7 › Public Profiles and Session Room › trusted badge shows on profiles with high reputation (12.4s)
  ok 34 [chromium] › tests\08-reviews-and-admin.spec.ts:5:7 › Peer Reviews and Reputation › sessions page loads for completed session check (9.6s)
  ok 35 [chromium] › tests\08-reviews-and-admin.spec.ts:11:7 › Peer Reviews and Reputation › public profile shows no-shows count (12.7s)
  ok 36 [chromium] › tests\08-reviews-and-admin.spec.ts:24:7 › Peer Reviews and Reputation › booking form shows commitment deposit section (10.3s)
  ok 37 [chromium] › tests\08-reviews-and-admin.spec.ts:35:7 › Admin Panel › non-admin cannot access admin page (11.4s)
  ok 38 [chromium] › tests\08-reviews-and-admin.spec.ts:41:7 › Admin Panel › admin ghost sweep API is protected (9.0s)
  ok 39 [chromium] › tests\08-reviews-and-admin.spec.ts:47:7 › Admin Panel › admin users API is protected (10.0s)
  ok 40 [chromium] › tests\08-reviews-and-admin.spec.ts:55:7 › Admin Panel › admin disputes API is protected (9.3s)
  ok 41 [chromium] › tests\08-reviews-and-admin.spec.ts:63:7 › Admin Panel › admin escrow API is protected (9.3s)
  ok 42 [chromium] › tests\09-ai-evaluation.spec.ts:5:7 › AI Evaluation Pipeline › AI evaluate API requires authentication (1.1s)
  ok 43 [chromium] › tests\09-ai-evaluation.spec.ts:12:7 › AI Evaluation Pipeline › AI transcribe API requires authentication (5.3s)
  ok 44 [chromium] › tests\09-ai-evaluation.spec.ts:17:7 › AI Evaluation Pipeline › AI evaluate API returns 404 for nonexistent session (11.2s)
  ok 45 [chromium] › tests\09-ai-evaluation.spec.ts:29:7 › AI Evaluation Pipeline › AI evaluate GET returns evaluation object or null (10.0s)
  ok 46 [chromium] › tests\09-ai-evaluation.spec.ts:37:7 › AI Evaluation Pipeline › session room shows AI evaluation panel after completion (9.8s)
  ok 47 [chromium] › tests\09-ai-evaluation.spec.ts:43:7 › AI Evaluation Pipeline › AI evaluation panel component exists in the codebase (12.2s)

  47 passed (8.0m)
```

**47/47 passed.** (For reference, the first run before the middleware fix was
45 passed / 2 failed — both of the ones now at lines 42–43 above.)

npm also reported "2 moderate severity vulnerabilities" during `npm install` in
Part B (pre-existing, unrelated to the two new packages — not investigated further
since fixing them wasn't in scope for this milestone and `npm audit fix --force`
can introduce breaking changes).

---

## Part J — AI pipeline cost analysis for demo (20–50 sessions)

**AssemblyAI batch transcription:**
- Rate: approximately $0.15 per hour of audio
- Demo volume: 20 sessions × 1 hour = 20 audio hours
- Estimated cost: $3.00 for full demo
- Note: Only sessions where both parties consent

**OpenAI GPT-4o-mini analysis:**
- Input: $0.15 per million tokens
- Output: $0.60 per million tokens
- Per session: ~13,000 tokens in + 500 tokens out
- Per session cost: ~$0.002
- 50 sessions cost: ~$0.10 total

**Total estimated demo cost: $3–5 USD**

No unexpected cost spikes if:
- Audio transcription uses batch mode not real-time
- Transcripts are capped at 8000 tokens in the prompt
- No runaway retry loops (idempotency guard prevents this)

---

## Part K — Manual steps

1. **Get your AssemblyAI API key:**
   a. Go to https://www.assemblyai.com and create a free account
   b. Go to your dashboard and copy your API key
   c. Open `skillswap/.env.local`
   d. Replace `YOUR_ASSEMBLYAI_API_KEY` with your real key

2. **Get your OpenAI API key:**
   a. Go to https://platform.openai.com and sign in or create an account
   b. Go to API Keys and create a new key
   c. Copy the key (you only see it once)
   d. Open `skillswap/.env.local`
   e. Replace `YOUR_OPENAI_API_KEY` with your real key

3. **Run the new RLS migration** (see Deviation #1 above): open
   `supabase/migrations/010_ai_eval_public_read.sql` in the Supabase SQL editor and
   run it, so the public-profile "AI Teaching Scores" section can actually display
   for visitors who weren't in the underlying sessions.

4. **Restart the dev server** after adding both keys:
   Stop with Ctrl+C then run: `npm run dev`

5. **Test the AI evaluation end to end:**
   a. Complete a session between two accounts
   b. In the session room after confirming completion, scroll to the
      AI Session Evaluation panel
   c. Click "Run AI Evaluation"
   d. Paste any teaching-style transcript (even a sample one)
   e. Click "Analyse Transcript"
   f. Wait 10–15 seconds for GPT-4o-mini to respond
   g. Confirm scores appear on all 5 dimensions with a feedback report below
   h. Go to the teacher's public profile and confirm the AI Teaching Scores
      section appears

6. **For demo mode without API keys:** the panel still renders and accepts
   transcript input. Without `OPENAI_API_KEY` set, the API returns a 503 with a
   clear message. Add the key to enable scoring.

---

## Report back to the orchestrator

- Both API keys added: **no** — only placeholders were added; real keys must be
  obtained and pasted in manually (Part K, steps 1–2).
- Dev server restarted: **no** — not yet needed since no real keys are in place.
- AI evaluation ran and returned scores: **not tested live** — requires a real
  `OPENAI_API_KEY`, which I don't have. All automated checks (TypeScript, all 47
  Playwright tests including the new AI-evaluation suite) pass.
- Feedback report appeared: **not tested live**, same reason.
- Any errors: none outstanding. Two were found and fixed during this pass — see
  "Two deviations from the literal spec" above (RLS gap, now migration
  `010_ai_eval_public_read.sql`, not yet run against the live DB; and a middleware
  gap in `src/middleware.ts`, now fixed and verified).
