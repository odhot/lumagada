# Lumagada 🇮🇩

A modern Indonesian classifieds marketplace inspired by the concept of large regional marketplaces, with original Lumagada branding/UI.

## Run locally
1. Install Node.js 20+.
2. `npm install`
3. Copy `.env.example` to `.env.local` and add Supabase URL + publishable key.
4. Run `supabase/schema.sql` in Supabase SQL Editor.
5. `npm run dev`
6. Open http://localhost:3000

## Deploy
Deploy the repository to Vercel or another Next.js host. Add the two environment variables in the hosting dashboard, then connect `lumagada.com` in the host's Domains settings.

## Included
- Responsive marketplace homepage
- Indonesian categories and location UI
- Search/filter-like discovery
- Listing detail pages
- Sell/listing flow UI
- Login/signup UI
- Seller dashboard UI
- Favorites UI
- Chat UI
- Supabase schema for profiles, listings, images, favorites, conversations, and messages
- RLS policies for user-owned data

## Production next steps
Wire the sell form and auth forms to Supabase, add Storage upload, server-side listing queries, moderation/reporting, phone/WhatsApp verification, payment/escrow if desired, SEO metadata, analytics, rate limiting, and transactional email.
