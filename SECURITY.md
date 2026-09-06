# Lumagada Security Launch Checklist

## Application controls

- Next.js pinned to a patched Active LTS release.
- React pinned to a patched release.
- `npm audit --omit=dev --audit-level=high` runs in CI.
- Typecheck and production build run in CI.
- Security headers and CSP are configured in `next.config.ts`.
- Browser source maps are disabled in production.
- `poweredBy` is disabled.
- Route handlers validate authentication, ownership, UUIDs, lengths, numeric ranges and write rates.
- RLS remains the database authorization boundary; UI checks are not treated as authorization.
- Supabase elevated credentials are server-only.
- Listing storage accepts only JPEG, PNG and WebP and has a 10 MiB per-file limit.

## Supabase production settings

Before the first real launch, configure these in the Supabase project dashboard:

1. Enable RLS on every application table and review Security Advisor findings.
2. Enable SSL enforcement.
3. Enable database Network Restrictions where compatible with the deployment architecture.
4. Enable email confirmation for new accounts.
5. Configure a production SMTP provider for reliable auth mail.
6. Enable CAPTCHA/Turnstile for sign-up, sign-in and password reset if bot traffic is expected.
7. Use a strong password policy and leaked-password protection when available on the selected plan.
8. Protect the Supabase organization and GitHub account with MFA/2FA.
9. Use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for browser code and `SUPABASE_SECRET_KEY` only on the server. Legacy names are retained temporarily for migration compatibility.
10. Do not put Supabase secret/service-role credentials in GitHub, browser bundles, or `NEXT_PUBLIC_*` variables.

## Pre-launch adversarial tests

Test API endpoints directly, not only through the UI:

- anonymous user cannot create listings, offers, chats or messages;
- user A cannot edit/delete user B's listing;
- user A cannot read user B's conversations/messages/offers;
- user A cannot accept/reject user B's seller offer;
- lowongan listings cannot receive offers;
- expired listings are not publicly readable as active listings;
- listing image uploads cannot exceed the storage size/MIME policy;
- rate limits return HTTP 429 when exceeded;
- sponsor rewards cannot be granted twice for the same user/listing/day;
- service-role/secret keys never appear in client JavaScript.

## Incident response

If a secret is exposed, rotate it immediately. If a database or storage policy is changed, deploy it through a version-controlled migration and rerun the negative-path tests.
