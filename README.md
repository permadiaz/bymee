# BYMEE

A responsive personal B2B sales workspace built with Next.js App Router, strict TypeScript, Tailwind CSS, and Supabase. Indonesian analysis; English interface. Designed for Vercel.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. Demo mode is on by default; no credentials are needed. Optional: copy `.env.example` to `.env.local`. Demo data includes three fictional accounts, contacts, interactions, an opportunity and next actions. All demo saves live in this browser's localStorage. Export them from Brain or History. Clearing browser storage removes demo work. Demo and cloud data are separate; sample records are never uploaded to a real account.

## Workflows

Dashboard → a quick action → generate → Save to Brain. Saved activity immediately contributes to account memory. Use Create Follow-up to add a next action; complete it on Home or reopen it from History. Search Brain by content, type, account, or pinned status. Account names open accumulated context. Inbox supports input categories; Response Assistant includes copy and follow-up actions. Dark mode follows your saved preference.

Demo outputs are illustrative templates, not semantic AI or live research. They preserve provided context and label evidence but require review. No web search provider is integrated; recent public information remains explicitly unavailable. Contacts in structured memory come from the Contact field; demo mode does not extract names from free text. Company matching uses exact names: use consistent spelling.

## Supabase cloud mode

1. Create a Supabase project and execute `supabase/migrations/001_initial.sql` once in SQL Editor.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public anon key, never service-role key).
3. Set `DEMO_MODE=false` and configure the AI variables below. Restart the server.
4. Use Create account, confirm the email if enabled in Supabase, and sign in. Configure Supabase Auth Site URL and allowed redirects for your local/production domain. Auth uses the browser Supabase client; AI requests pass the access token and the server verifies it with `getUser()`.

RLS applies to all nine tables. Composite foreign keys prevent cross-user company references. `save_activity` saves the knowledge item, company, contacts and workflow record atomically under invoker permissions. `consume_ai_quota` atomically allows at most 30 analyses per user per UTC database day; counters cannot be changed through the client. No service-role key is used. Cloud mode starts empty. Actual cloud auth, SQL migration, and multi-user RLS verification require your Supabase project and must be checked before production use.

## AI providers

Direct Google Gemini endpoints (`AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai`) are automatically routed through the native `generateContent` API. Existing environment variables remain valid. Gemini requests include a JSON Schema derived from BYMEE's output validator, and distinguish blocked, empty, and truncated output. Other providers continue using chat completions. Upstream failures show the adapter and HTTP status; server logs exclude API keys, customer context, and raw provider responses. Native adapter behavior is verified with mocked responses; real project credentials are required for live validation.

`lib/ai/provider.ts` implements the `AIProvider` interface. `DEMO_MODE=true` selects free local templates. Setting false enables an OpenAI-compatible chat-completions adapter with a server-only API key, a 45-second timeout, and Zod output validation.

Set `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` for your chosen OpenAI-compatible provider. OpenAI, OpenRouter, and Gemini's compatibility endpoint can be configured without changing React components. Providers/models must support JSON object responses. Native provider adapters can implement `AIProvider` if compatibility differs. There is no silent demo fallback in live mode. Paid APIs can incur costs; demo mode performs no AI network calls. Free-tier eligibility and limits depend on hosting providers and usage.

## PWA and deployment

The manifest includes 192px and 512px icons, mobile viewport and standalone display. A service worker provides an offline fallback page without caching private API responses or cloud pages. Initial use requires a connection; offline analysis is not supported. Install through the browser menu on localhost or HTTPS.

Import this repository into Vercel with the Next.js preset. Add the environment variables, apply the Supabase migration, and deploy. Demo deployment needs no environment variables. No deployment is performed by this repository setup.

## Validation

```sh
npm run test
npm run typecheck
npm run build
```

Before production: verify two distinct Supabase users cannot read/write each other's records, email confirmation and sign-out behavior, provider output/error handling, and your configured API spending limits. This project provides the working MVP and deployment configuration, not a claim of completed live infrastructure validation.

## Structure

- `app/`: App Router shell and server AI endpoint
- `components/`: workspace, workflows, result renderer, authentication
- `lib/ai/`: schemas, prompt principles, demo and provider abstraction
- `lib/use-workspace.ts`: browser demo persistence and authenticated Supabase persistence
- `supabase/migrations/`: schema, RLS, transactional save and quota functions
- `public/`: PWA manifest, icons, offline fallback
- `tests/`: structured workflow and input validation checks
