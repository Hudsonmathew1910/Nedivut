// Checks that the database, payment gateway and email are connected.
// Run after filling in .env (or .env.local):   npm run check:setup
//
// Read-only: it never creates orders, donations or rows. Secrets are never printed.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// --- Load .env then .env.local (later files win, like Next.js) ---------------
const env = { ...process.env };
for (const file of [".env", ".env.local"]) {
  const path = join(process.cwd(), file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

let failures = 0;
let warnings = 0;
const ok = (msg) => console.log(`  \x1b[32m✔\x1b[0m ${msg}`);
const fail = (msg, fix) => {
  failures++;
  console.log(`  \x1b[31m✘\x1b[0m ${msg}${fix ? `\n      → ${fix}` : ""}`);
};
const warn = (msg, fix) => {
  warnings++;
  console.log(`  \x1b[33m!\x1b[0m ${msg}${fix ? `\n      → ${fix}` : ""}`);
};

const isPlaceholder = (v) => !v || /x{4}|your[-_]|changeme|<.*>/i.test(v);
function requireVar(name, fix) {
  const v = env[name];
  if (isPlaceholder(v)) {
    fail(`${name} is ${v ? "still a placeholder" : "missing"}`, fix);
    return null;
  }
  ok(`${name} is set`);
  return v;
}

async function get(url, headers) {
  try {
    const res = await fetch(url, { headers });
    let body = null;
    try {
      body = await res.json();
    } catch {
      /* not JSON */
    }
    return { status: res.status, body };
  } catch (err) {
    return { status: 0, body: { message: err.message } };
  }
}

// --- Site ---------------------------------------------------------------------
console.log("\nSite");
const siteUrl = env.NEXT_PUBLIC_SITE_URL;
if (!siteUrl) fail("NEXT_PUBLIC_SITE_URL is missing", "Set it to http://localhost:3000 for local testing, or the live domain.");
else ok(`NEXT_PUBLIC_SITE_URL = ${siteUrl}`);
if (isPlaceholder(env.FORM_SIGNING_SECRET)) warn("FORM_SIGNING_SECRET is empty (falls back to the service-role key)", "Set a random value, e.g. run: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
else ok("FORM_SIGNING_SECRET is set");
if (isPlaceholder(env.RATE_LIMIT_SALT)) warn("RATE_LIMIT_SALT is empty (falls back to a fixed value)", "Set a random value, same command as above.");
else ok("RATE_LIMIT_SALT is set");

// --- Supabase -----------------------------------------------------------------
console.log("\nDatabase (Supabase)");
const sbUrl = requireVar("NEXT_PUBLIC_SUPABASE_URL", "Supabase → Project Settings → API → Project URL");
const sbAnon = requireVar("NEXT_PUBLIC_SUPABASE_ANON_KEY", "Supabase → Project Settings → API → anon public key");
const sbService = requireVar("SUPABASE_SERVICE_ROLE_KEY", "Supabase → Project Settings → API → service_role key (keep secret)");

if (sbUrl && sbService) {
  const base = sbUrl.replace(/\/$/, "");
  const admin = { apikey: sbService, Authorization: `Bearer ${sbService}` };

  const purposes = await get(`${base}/rest/v1/donation_purposes?select=slug,label,active&order=sort`, admin);
  if (purposes.status === 0) {
    fail(`Cannot reach Supabase: ${purposes.body?.message}`, "Check NEXT_PUBLIC_SUPABASE_URL and your internet connection.");
  } else if (purposes.body?.code === "42501") {
    fail("Tables exist but the API has no permission to use them", "Run supabase/migrations/0003_api_grants.sql in the Supabase SQL editor.");
  } else if (purposes.status === 401 || purposes.status === 403) {
    fail("Supabase rejected the service-role key", "Copy the service_role key again from Project Settings → API.");
  } else if (purposes.status === 404 || purposes.body?.code === "42P01" || purposes.body?.code === "PGRST205") {
    fail("Database tables not found", "Run supabase/migrations/0001_init.sql in the Supabase SQL editor.");
  } else if (purposes.status !== 200) {
    fail(`Unexpected Supabase response (${purposes.status}): ${purposes.body?.message ?? ""}`);
  } else {
    ok("Connected; tables exist (0001_init.sql has been run)");
    const active = purposes.body.filter((p) => p.active).map((p) => p.slug);
    if (active.includes("mentorship") && !active.includes("elder-care")) {
      ok(`Donation options are up to date: ${purposes.body.filter((p) => p.active).map((p) => p.label).join(", ")}`);
    } else {
      fail("Donation options are out of date (Elder Care still active or Student Mentorship missing)",
        "Run supabase/migrations/0002_children_focus_programmes.sql in the Supabase SQL editor.");
    }

    for (const table of ["donations", "payment_events", "support_requests", "support_documents", "enquiries", "impact_metrics", "rate_limits"]) {
      const r = await get(`${base}/rest/v1/${table}?select=*&limit=0`, admin);
      if (r.body?.code === "42501") fail(`No API permission on table "${table}"`, "Run supabase/migrations/0003_api_grants.sql.");
      else if (r.status !== 200) fail(`Table "${table}" is not available (${r.status})`, "Re-run supabase/migrations/0001_init.sql.");
    }

    const bucket = await get(`${base}/storage/v1/bucket/support-documents`, admin);
    if (bucket.status === 200 && bucket.body?.public === false) ok("Private document bucket \"support-documents\" exists");
    else if (bucket.status === 200) fail("Bucket \"support-documents\" is PUBLIC", "Supabase → Storage → support-documents → make it private.");
    else fail("Storage bucket \"support-documents\" not found", "Re-run supabase/migrations/0001_init.sql.");
  }

  if (sbAnon) {
    const pub = await get(`${base}/rest/v1/donation_purposes?select=slug&limit=1`, { apikey: sbAnon, Authorization: `Bearer ${sbAnon}` });
    if (pub.status === 200) ok("Public (anon) key works");
    else fail(`Public (anon) key rejected (${pub.status})`, "Copy the anon public key again from Project Settings → API.");
    const leak = await get(`${base}/rest/v1/donations?select=id&limit=1`, { apikey: sbAnon, Authorization: `Bearer ${sbAnon}` });
    if (leak.status === 200 && Array.isArray(leak.body) && leak.body.length > 0) fail("SECURITY: donations are readable with the public key", "Row-level security is off on the donations table. Re-run 0001_init.sql.");
  }
}

// --- Razorpay -----------------------------------------------------------------
console.log("\nPayment gateway (Razorpay)");
const rzpId = requireVar("NEXT_PUBLIC_RAZORPAY_KEY_ID", "Razorpay Dashboard → Account & Settings → API Keys → Key Id");
const rzpSecret = requireVar("RAZORPAY_KEY_SECRET", "Razorpay Dashboard → API Keys → Key Secret (shown once when generated)");
requireVar("RAZORPAY_WEBHOOK_SECRET", "Razorpay Dashboard → Webhooks → add https://<your-domain>/api/webhooks/razorpay and set a secret");

if (rzpId && rzpSecret) {
  const mode = rzpId.startsWith("rzp_live_") ? "LIVE" : rzpId.startsWith("rzp_test_") ? "TEST" : "unknown";
  const auth = { Authorization: `Basic ${Buffer.from(`${rzpId}:${rzpSecret}`).toString("base64")}` };
  const r = await get("https://api.razorpay.com/v1/orders?count=1", auth);
  if (r.status === 200) ok(`Key Id and Key Secret are valid (${mode} mode)`);
  else if (r.status === 401) fail("Razorpay rejected the Key Id / Key Secret pair", "Make sure both come from the same mode (test or live) and were copied fully.");
  else fail(`Cannot verify Razorpay keys (${r.status}): ${r.body?.error?.description ?? r.body?.message ?? ""}`);
  if (mode === "TEST") warn("Razorpay is in TEST mode: no real money is collected", "Switch to rzp_live_ keys only after end-to-end testing.");
  if (mode === "LIVE" && /localhost/.test(siteUrl ?? "")) warn("LIVE Razorpay keys with a localhost site URL");
}
console.log("    (The webhook secret can only be confirmed by a real webhook delivery: see the Razorpay dashboard → Webhooks → delivery logs.)");

// --- Email (optional) ---------------------------------------------------------
console.log("\nEmail (Resend, optional)");
if (isPlaceholder(env.RESEND_API_KEY)) {
  warn("RESEND_API_KEY is empty: receipts and acknowledgements will not be emailed", "Optional. Receipts can still be downloaded from the status page.");
} else {
  const r = await get("https://api.resend.com/domains", { Authorization: `Bearer ${env.RESEND_API_KEY}` });
  if (r.status === 200) {
    ok("Resend API key is valid");
    const verified = (r.body?.data ?? []).filter((d) => d.status === "verified").map((d) => d.name);
    const fromDomain = (env.EMAIL_FROM ?? "").match(/@([^>\s]+)/)?.[1];
    if (fromDomain && verified.includes(fromDomain)) ok(`Sending domain ${fromDomain} is verified`);
    else warn(`Sending domain ${fromDomain ?? "(EMAIL_FROM not set)"} is not verified in Resend`, "Resend → Domains → add and verify it, or emails will be rejected.");
  } else if (r.status === 401 || r.status === 403) {
    fail("Resend rejected the API key");
  } else {
    warn(`Could not verify Resend key (${r.status})`);
  }
  if (isPlaceholder(env.TEAM_NOTIFY_EMAIL)) warn("TEAM_NOTIFY_EMAIL is empty: the team will not be alerted about new requests and enquiries");
  else ok("TEAM_NOTIFY_EMAIL is set");
}

// --- Summary ------------------------------------------------------------------
console.log("");
if (failures) {
  console.log(`\x1b[31m${failures} problem(s) to fix\x1b[0m${warnings ? `, ${warnings} warning(s)` : ""}.`);
  process.exit(1);
}
console.log(`\x1b[32mAll required services are connected.\x1b[0m${warnings ? ` ${warnings} warning(s) above.` : ""}`);
