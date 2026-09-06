# Lumagada 🇮🇩

Lumagada is an Indonesian-first classifieds marketplace: **Cari. Jual. Ketemu.**

## Preview locally

Requirements: Node.js 20+

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The UI can be previewed without Supabase credentials, but real sign-up, selling, storage, chat, favorites, offers, and the seller dashboard require the production Supabase environment described below.

## Production deployment

### Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Enable Email/Password authentication.
4. Add the production site URL and `/auth/callback` to Supabase Auth redirect URLs.
5. Keep the `listing-images` bucket/policies created by the schema.
6. Enable Realtime for `messages`, `conversations`, and `notifications` if realtime subscriptions are enabled.

### Vercel

Set these server environment variables in the Vercel project:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server-only; never expose it to the browser
- `CRON_SECRET` — a strong random secret used by the daily expiry job

The daily Vercel cron calls `/api/cron/expire` and expires regular listings after their 14-day window. Pro listings are exempt from regular expiry.

## Marketplace rules

- Every seller/provider must have an authenticated Lumagada account.
- Regular listings stay active for 14 days.
- Owners can re-up expired regular listings from the dashboard.
- Pro listings remain active under the Pro policy.
- Sellers can choose whether products/services accept offers.
- Lowongan listings never accept price offers.
- Restricted/illegal services and private tutoring listings are blocked by the shared policy and server-side listing API.
- Sponsor rewards are intended to grant +1 day after a verified 30-second sponsor watch; the production reward event must be wired to the actual sponsor/ad provider before launch.
- For transactions above Rp1.000.000, a platform fee may apply according to the Terms of Service. The exact fee is intentionally not exposed in public UI.
- Lumagada provides the marketplace platform; users are responsible for verifying and completing their own transactions.

## Routes

- `/` — marketplace homepage, search, category and distance filtering
- `/listing/[id]` — listing detail, favorites, chat, offers and reports
- `/sell` — authenticated listing creation with Supabase Storage uploads
- `/login` — sign-up/login and Terms of Service
- `/favorites` — saved listings
- `/chat` — authenticated buyer/seller messaging
- `/dashboard` — authenticated seller dashboard, re-up and incoming offers
- `/api/health` — deployment health check

## Production readiness

The application code is prepared for real Supabase-backed use. Before public launch, the production Supabase project must have the schema applied and the four Vercel environment variables configured. Vercel build limits/rate limits are infrastructure-level and do not indicate an application-code failure.
