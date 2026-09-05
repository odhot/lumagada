# Lumagada 🇮🇩

Lumagada is an Indonesian-first classifieds marketplace: **Cari. Jual. Ketemu.**

## Preview locally

Requirements: Node.js 20+

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The demo works without environment variables and uses curated demo listings, so the UI can be previewed immediately.

## Production deployment

### Vercel

Import `odhot/lumagada` into Vercel. The project is already configured as a standard Next.js app. Add these environment variables when Supabase is connected:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Supabase

Run `supabase/schema.sql` in the Supabase SQL editor. The schema includes profiles, categories, listings, images, favorites, conversations, messages, and RLS policies.

## Routes

- `/` — marketplace homepage and search
- `/listing/1` — listing detail demo
- `/sell` — create-listing UI
- `/login` — authentication UI
- `/favorites` — saved listings
- `/chat` — buyer/seller chat UI
- `/dashboard` — seller dashboard
- `/api/health` — deployment health check

## Product direction

The UX is inspired by familiar classifieds patterns but uses original Lumagada branding, copy, visual treatment, and Indonesian localization. It is designed to grow into a full marketplace with real authentication, image storage, listings, moderation, chat, verification, and payments.
