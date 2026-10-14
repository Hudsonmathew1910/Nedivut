import "server-only";
import { supabaseAdmin } from "./supabase";
import { emailLayout, sendEmail } from "./email";
import { fetchOrderPayments } from "./razorpay";
import { site } from "./site";

export type Donation = {
  id: string;
  created_at: string;
  amount_paise: number;
  purpose: string;
  donor_name: string;
  email: string;
  phone: string;
  address: string | null;
  pan: string | null;
  status: "created" | "pending" | "success" | "failed" | "cancelled" | "refunded" | "chargeback";
  gateway_order_id: string | null;
  gateway_payment_id: string | null;
  method: string | null;
  paid_at: string | null;
  receipt_no: string | null;
  receipt_token: string;
};

/** Looks up a donation only when the caller holds its secret receipt token. */
export async function getDonationForToken(id: string, token: string): Promise<Donation | null> {
  const uuid = /^[0-9a-f-]{36}$/i;
  if (!uuid.test(id) || !uuid.test(token)) return null;
  const { data } = await supabaseAdmin()
    .from("donations")
    .select("*")
    .eq("id", id)
    .eq("receipt_token", token)
    .maybeSingle();
  return (data as Donation | null) ?? null;
}

export function receiptPath(d: Pick<Donation, "id" | "receipt_token">) {
  return `/api/receipts/${d.id}?t=${d.receipt_token}`;
}

export function statusPath(d: Pick<Donation, "id" | "receipt_token">) {
  return `/donate/status?d=${d.id}&t=${d.receipt_token}`;
}

/**
 * Marks the donation paid and issues its receipt number exactly once (the
 * database function is idempotent). Sends the receipt email only on the call
 * that actually confirmed it, so webhook retries never duplicate emails.
 */
export async function confirmDonation(orderId: string, paymentId: string, method: string | null) {
  const db = supabaseAdmin();
  const { data, error } = await db.rpc("confirm_donation", {
    p_order_id: orderId,
    p_payment_id: paymentId,
    p_method: method,
  });
  if (error) throw new Error(`confirm_donation failed: ${error.message}`);
  const row = (data as { out_donation_id: string; out_receipt_no: string; out_newly_confirmed: boolean }[])[0];
  if (!row) return null;

  if (row.out_newly_confirmed) {
    const { data: d } = await db.from("donations").select("*").eq("id", row.out_donation_id).single();
    if (d) await emailReceipt(d as Donation);
  }
  return row;
}

export async function emailReceipt(d: Donation) {
  const amount = (d.amount_paise / 100).toLocaleString("en-IN");
  const sent = await sendEmail(
    d.email,
    `Thank you for your donation – receipt ${d.receipt_no}`,
    emailLayout(
      "Thank you for your donation",
      [
        `Dear ${d.donor_name},`,
        `We have received your donation of INR ${amount}. Your receipt number is ${d.receipt_no}.`,
        "Your contribution goes directly to the work of the trust. You can download your receipt using the button below at any time.",
      ],
      { label: "Download receipt", href: `${site.url}${receiptPath(d)}` },
    ),
  );
  if (sent) {
    await supabaseAdmin().from("donations").update({ receipt_emailed_at: new Date().toISOString() }).eq("id", d.id);
  }
}

/**
 * Asks the gateway directly (server to server) for the latest state of an
 * unresolved donation. Used by the status page so donors see the truth even
 * if a webhook is delayed.
 */
export async function reconcileDonation(d: Donation): Promise<Donation> {
  if (!d.gateway_order_id || !["created", "pending", "cancelled", "failed"].includes(d.status)) return d;
  try {
    const { items } = await fetchOrderPayments(d.gateway_order_id);
    const captured = items.find((p) => p.status === "captured");
    if (captured) {
      await confirmDonation(d.gateway_order_id, captured.id, captured.method);
    } else if (items.some((p) => p.status === "authorized") && d.status !== "pending") {
      await supabaseAdmin().from("donations").update({ status: "pending" }).eq("id", d.id).in("status", ["created", "failed", "cancelled"]);
    } else {
      return d;
    }
    const { data } = await supabaseAdmin().from("donations").select("*").eq("id", d.id).single();
    return (data as Donation) ?? d;
  } catch (err) {
    console.error("reconcile failed", err);
    return d;
  }
}
