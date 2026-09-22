# Digital Heroes

A subscription-driven golf performance, charity draw, and reward platform — built against the
Digital Heroes PRD (Level 1, 2026 Edition).

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Framer Motion · Supabase (Postgres, Auth,
Storage) · Stripe · Vercel.

## Architecture

- **Draw engine (`src/lib/draw/`)** is pure TypeScript with no database calls — `random.ts`,
  `algorithmic.ts`, `match.ts`, `prize-pool.ts` and `simulate.ts` are unit-tested in
  `tests/draw-engine.test.ts` (`npm run test`). `src/actions/draws.ts` is the thin glue layer that
  fetches data, calls the engine, and persists the result.
- **Persistence is atomic.** Publishing a draw calls a single Postgres function
  (`publish_draw` in `supabase/migrations/0002_draw_publish.sql`) that updates `draws` and
  bulk-inserts `draw_entries` in one transaction, so a mid-write failure can never leave a
  published draw with partial entries.
- **Security is layered.** Row Level Security (`0001_init.sql`) is the source of truth —
  subscribers can only write their own scores while an active subscription exists, only admins
  can touch draws/payouts, winner proof uploads are scoped to the uploader's own folder. Server
  Action guards (`src/lib/auth/guards.ts`) are a second, app-level check so a missing UI
  condition can never become a security hole.
- **Money** is stored as integer minor units (pence) everywhere, never floats.
- **Stripe is the single source of truth for subscription state** — `subscriptions` is written
  only by the webhook (via the service-role client), never by the browser.

## Assumptions made to resolve ambiguity in the PRD

The PRD explicitly states "ambiguity is part of the test." Here's what was resolved and why:

1. **A subscriber's "ticket" is their 5 latest scores.** The PRD doesn't say how a user's numbers
   are chosen for the draw — their Stableford scores share the 1–45 range with the draw numbers,
   so their 5 current scores double as their entry. A subscriber needs exactly 5 scores on file to
   be eligible for a given draw.
2. **"Algorithmic — weighted by score frequency"** is implemented as: numbers that appear more
   often across every eligible subscriber's current scores are more likely to be drawn (weighted
   sampling without replacement). This ties the "algorithmic" draw to real platform activity.
3. **Prize pool revenue** = this month's active-subscription revenue (yearly plans normalised to
   a monthly equivalent, `amount / 12`) × `prize_pool_percent` (configurable in
   `platform_settings`, defaults to 50%).
4. **Duplicate-date scores**: the PRD says an existing entry may only be edited or deleted, so the
   add-score form rejects a second entry for a date already used (Postgres `unique_violation`)
   rather than silently overwriting it.
5. **Tier remainder on split prizes** is floored per winner; any leftover minor units from the
   division stay with the platform, standard lottery practice, rather than being fractionally
   distributed.
6. **Email confirmation is required** before first login (Supabase's default) — `/auth/callback`
   handles the confirmation redirect.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Stripe keys
```

1. Create a **new** Supabase project (not a personal one, per the PRD's deployment constraints).
2. Run both migrations in the SQL editor, in order: `supabase/migrations/0001_init.sql`, then
   `0002_draw_publish.sql`.
3. In Supabase Auth settings, add `${SITE_URL}/auth/callback` as a redirect URL.
4. In Stripe, create Monthly and Yearly recurring Prices, and a webhook endpoint at
   `/api/stripe/webhook` subscribed to `customer.subscription.created`, `.updated`, `.deleted`,
   `invoice.paid`, and `checkout.session.completed`.
5. `npm run gen:types` to generate `src/types/database.types.ts` from your live schema.
6. Sign up through the app once, then promote yourself to admin:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
7. `npm run dev`.

## Deployment

- Deploy to a **new** Vercel project (per the PRD's constraints), set all `.env` variables there.
- Point the Stripe webhook at the deployed URL, not localhost.
- Run `npm run test` in CI before deploy — the draw engine's unit tests are the highest-value
  regression check in the codebase.

## Test credentials

_Fill in after seeding your deployed instance:_

| Role       | Email | Password |
| ---------- | ----- | -------- |
| Subscriber |       |          |
| Admin      |       |          |

## Known limitations / next steps

- The customer-facing subscription cancel/upgrade flow relies on Stripe's hosted billing portal
  rather than a custom in-app UI — faster to ship correctly, and it's what the PRD's "handles
  renewal, cancellation, lapsed states" requirement needs functionally.
- No automated monthly draw scheduler yet — an admin currently triggers "create next draw" and
  "publish" manually. A Vercel Cron job calling `createNextDraw` on the 1st of each month, plus a
  reminder to publish, is the natural next step.
- Admin charity CRUD doesn't yet support image upload to the `charity-media` bucket from the UI
  (the bucket and its policies exist in the schema) — currently image_path is set manually.
