# Lumagada production setup

## Stack
- Next.js App Router + Vercel
- Supabase Auth, Postgres, RLS, Storage and optional Realtime
- CDN-friendly paginated listing API
- Indexed text search and radius search

## Supabase
1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Enable email/password authentication.
4. Add the site URL and `/auth/callback` to Auth redirect URLs.
5. The schema creates the `listing-images` public bucket and storage policies.
6. Enable Realtime for `messages`, `conversations`, and `notifications` if live chat is enabled.

## Vercel
Set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose to the browser)
- `CRON_SECRET`

The Vercel cron calls `/api/cron/expire` daily to expire regular listings after their 14-day window.

## API
- `GET/POST /api/listings`
- `GET /api/listings/:id`
- `GET/POST /api/conversations`
- `GET/POST /api/messages`
- `GET/POST /api/offers`
- `GET /api/cron/expire` (protected by `CRON_SECRET`)

## Scale notes
The database uses composite indexes, GIN full-text/trigram indexes, pagination, RLS, and a database radius-search RPC so the application does not need to load the marketplace into the browser. Keep page sizes <=100 and use cursor pagination for very large datasets as traffic grows beyond the initial 10,000-user target.

## Security
Never put `SUPABASE_SERVICE_ROLE_KEY` in `NEXT_PUBLIC_*` variables. Keep all privileged operations on the server. Public listing reads are controlled by RLS; seller, buyer, message, offer, favorite, report and notification records are user-scoped.

## Business rules implemented in the schema
- Every seller/provider must have an authenticated account.
- Regular listings expire after 14 days and can be re-upped by the owner.
- Pro listings can remain active under the Pro policy.
- Lowongan listings cannot accept price offers.
- Other listings can opt into/out of offers.
- Platform fee policy is intentionally not exposed in public UI; the threshold is above Rp1,000,000 and the actual fee must be configured internally before real transactions are recorded.
