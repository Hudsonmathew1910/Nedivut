# Nedivut Charitable Trust — Website

Public website for Nedivut Charitable Trust, Coimbatore, built from the *Website BRD v1.0* (16 Sep 2026).

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS v4 · Supabase (Postgres + private Storage) · Razorpay · Resend (optional email) · Vercel.

## What is included

| Area | Where | BRD refs |
| --- | --- | --- |
| Home, About, Programmes, Impact, Stories, FAQs, policies | `src/app/*` | IA |
| Contact form → `enquiries` table, acknowledgement, honeypot + rate limit | `src/app/contact` | CON 01–03 |
| Education-support request → `support_requests`, documents uploaded straight to a **private** bucket via signed URLs, magic-byte check, non-guessable reference, minor/guardian-consent rules | `src/app/request-support` | REQ 01–07, 09 |
| Donations: presets/custom amount, configurable purposes, pending record → Razorpay order → checkout (UPI/cards/net banking) | `src/app/donate` | DON 01–05 |
| Server-side confirmation (signature + gateway API), signed idempotent webhook, success/pending/failed/cancelled pages | `src/app/donate/status`, `src/app/api/webhooks/razorpay` | DON 06–09 |
| Receipt number issued exactly once in the DB, branded PDF download, receipt email once | `src/lib/receipt.ts`, `src/app/api/receipts/[id]` | REC 01–05, 07 |
| Impact metrics: draft → approved, only approved values with as-of date and definition are public, change history | `impact_metrics` table | IMP 01–05 |
| Audit log of status changes and metric edits, RLS on every table | `supabase/migrations/0001_init.sql` | Security |

Brand colours are sampled from the logo: teal `#0f4643`, gold `#d69d58`, cream `#f8f7f3` (see `src/app/globals.css`).

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev
```

The site runs without any keys: forms show a friendly error and impact numbers show "Being verified".

### 1. Supabase
1. Create a project (region: Mumbai `ap-south-1`).
2. SQL editor → paste and run `supabase/migrations/0001_init.sql`. This creates tables, RLS, functions and the private `support-documents` bucket.
3. Copy the Project URL, `anon` key and `service_role` key into `.env.local`. **Never expose the service-role key to the browser.**

### 2. Razorpay
1. Dashboard → API Keys: put the key ID in `NEXT_PUBLIC_RAZORPAY_KEY_ID` and the secret in `RAZORPAY_KEY_SECRET` (use test mode first).
2. Dashboard → Webhooks: URL `https://<your-domain>/api/webhooks/razorpay`, with events `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`, `payment.dispute.created`. Put the secret in `RAZORPAY_WEBHOOK_SECRET`.

### 3. Email (optional)
Create a Resend account, verify the sending domain and set `RESEND_API_KEY`, `EMAIL_FROM` and `TEAM_NOTIFY_EMAIL`. Without these, emails are skipped and everything else still works.

## Deploy on Vercel
1. Push this folder to a GitHub repository.
2. On vercel.com, choose **Add New → Project** and import the repository (framework is detected automatically).
3. Add every variable from `.env.example` under **Settings → Environment Variables**, and set `NEXT_PUBLIC_SITE_URL` to the production domain.
4. Deploy, then add the custom domain and update the Razorpay webhook URL to that domain.

## Day-to-day administration (until an admin portal is built)
Use the Supabase dashboard **Table editor** with named staff accounts and MFA enabled:
- **Impact numbers:** edit `impact_metrics` (fill `value`, `as_of`, `source`, `approved_by`, then set `status = approved`). The site refreshes within an hour.
- **Donation purposes:** `donation_purposes` (toggle `active`, edit labels).
- **Requests:** `support_requests` (`status`, `assignee`, `internal_notes`). Documents are in Storage → `support-documents/<request id>/`.
- **Donations / receipts:** `donations`. Resend a receipt by sharing `/api/receipts/<id>?t=<receipt_token>`.
- **Enquiries:** `enquiries`.

## Before launch (BRD dependencies)
- [ ] Fill trust contact details and legal fields in `src/lib/site.ts` (address, PAN, registration; `section80G` only after CA approval).
- [ ] Legal review of the draft policies in `src/app/policies/[slug]/page.tsx`.
- [ ] Replace the illustration tiles with consented photography (`ArtTile` in `src/components/ui.tsx`).
- [ ] Approve impact metric definitions and values.
- [ ] Switch Razorpay to live keys; run end-to-end payment tests, including failure, cancel and refund.
- [ ] Security test, accessibility audit (WCAG 2.2 AA) and Core Web Vitals check.

## Not in this release (next phases)
Admin portal with roles/MFA (currently the Supabase dashboard), CMS for stories/gallery, malware scanning service for uploads, recurring donations, donor accounts, Tamil content.
