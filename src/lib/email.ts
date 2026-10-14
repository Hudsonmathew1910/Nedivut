import "server-only";
import { site } from "./site";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? `${site.name} <no-reply@nedivut.org>`;

export const isEmailConfigured = Boolean(apiKey);

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Wraps plain paragraphs in the trust's branded email shell. */
export function emailLayout(title: string, paragraphs: string[], cta?: { label: string; href: string }) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px">${escape(p)}</p>`).join("");
  const button = cta
    ? `<p style="margin:22px 0"><a href="${cta.href}" style="background:#d69d58;color:#0f4643;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">${escape(cta.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f8f7f3;font-family:Arial,sans-serif;color:#1d2b2a">
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="background:#0f4643;color:#f8f7f3;padding:20px 24px;border-radius:12px 12px 0 0;font-size:18px;font-weight:700">${escape(site.name)}</div>
<div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;line-height:1.55">
<h1 style="font-size:20px;margin:0 0 16px;color:#0f4643">${escape(title)}</h1>${body}${button}
<p style="margin:24px 0 0;font-size:12px;color:#5b6b69">${escape(site.city)} · ${escape(site.contact.email)}</p>
</div></div></body></html>`;
}

/**
 * Sends a transactional email through Resend. A no-op (returns false) when no
 * provider is configured so forms keep working in development.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!apiKey) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) console.error("email send failed", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("email send failed", err);
    return false;
  }
}

/** Internal alert to the trust team, if an address is configured. */
export async function notifyTeam(subject: string, lines: string[]) {
  const to = process.env.TEAM_NOTIFY_EMAIL;
  if (!to) return;
  await sendEmail(to, subject, emailLayout(subject, lines));
}
