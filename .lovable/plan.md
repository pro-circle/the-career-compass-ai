## 1. Landing page cleanup

- Remove the invented metrics band (-42% / 6.2M / 180k / 92%) from `src/routes/index.tsx`. There is no testimonial block left in the file, so nothing else to strip there.

## 2. Multi-provider AI layer (Groq x3 + Gemini + web search)

New `src/lib/ai-provider.server.ts`:

- Reads `GROQ_API_KEY_1/2/3` and `GEMINI_API_KEY` (all server-only, from `.env`).
- Round-robins Groq keys per request; on 429/5xx/auth error, rotates to the next key, then falls back to `gemini-2.5-flash`.
- Exposes `getChatModel()` (streaming) and `getGroundedModel()` (Gemini with Google Search grounding enabled) plus a `runWithFallback()` helper for one-shot JSON extraction.
- Web search is automatic: when a request needs live data (job-link enrichment, salary data, company research, assistant questions about current market), the agent routes to the grounded Gemini model and returns cited text.

Wire it into `src/routes/api/chat.ts`, `src/routes/api/generate.ts`, `src/lib/joblink.functions.ts`, and `src/lib/profile.functions.ts`, replacing direct `getGroqModel()` calls. `src/lib/groq.server.ts` stays as a thin key-pool helper.

`.env.example` updated with the new key names (old single `GROQ_API_KEY` still honored as a fallback).

## 3. Automatic job apply (candidate)

- New `src/lib/autoapply.functions.ts`: server functions to read/write the candidate's auto-apply settings (enabled, min match score, daily cap, location/type filters) and an `autoApplyTick` function that picks the highest-scoring un-applied matches, has the AI draft a short tailored note, writes `applications` rows, and logs each action.
- Settings + log persisted in Supabase: `auto_apply_settings` and `auto_apply_log` tables added to `docs/schema.sql` (RLS + grants).
- Agent runs browser-side while signed in: a `useAutoApplyAgent` hook polls `autoApplyTick` on an interval when the toggle is on, showing toasts for each application submitted.
- The existing "Auto-apply" checkbox on `/candidate/jobs` becomes the real control, plus an activity panel listing what the agent applied to and why.
- Connect Supabase db as same as using keys in .env - generate the complete db schema for the site. Let the mock login remain as it is and also accespt new verified sign ins and logins.

## 4. Dark / light mode everywhere

- Audit every route for hardcoded colors and swap to semantic tokens so both themes render correctly (landing, demo, auth pages, all `_app.*` pages).
- Ensure `.dark` token set in `src/styles.css` covers surfaces, borders, charts, and the accent/brand pairs; add smooth `color-scheme` and transition handling.
- Add the theme toggle to the landing page header and the auth pages (currently only the demo page and app top bar have it).
  &nbsp;

## 5. Remove remaining mock data

`src/lib/mock-data.ts` arrays are already empty, but several pages still import them and render placeholder-shaped UI. Rewire these to Supabase server functions (with the mock overlay as the only source of sample data, still opt-in via the demo page):
`_app.employer.index / jobs / candidates / analytics / interviews / careers / talent-pool`, `_app.candidate.index / jobs / applications / skills / interview`. Then delete `src/lib/mock-data.ts` and its imports, keeping types in `src/lib/types.ts`.  
Also add a "Load Mock Data" button on the page top after loggin in for both the sections to import the bock data of candidates, and all... after import rename the "Load Mock Data" to "Clear Mock Data" dynamicall, to clear the mock data and make it clean as newer (only all the mock data is removed).

## 6. Architecture diagram

Add `docs/ARCHITECTURE.md` with an ASCII diagram covering browser routes → TanStack server functions / API routes → AI router (Groq key pool → Gemini fallback → grounded search) and Supabase tables, plus the auto-apply agent loop.

## Verification

Run `bun run build` and load the app in a headless browser to confirm both themes render, the auto-apply toggle drives the agent, and no page depends on `mock-data.ts`.