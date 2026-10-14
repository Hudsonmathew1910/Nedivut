"use server";

import { z } from "zod";
import type { FormState } from "@/components/form";
import { confirmDonation, getDonationForToken, statusPath } from "@/lib/donations";
import { genericFailure, rateLimited, validationFailure } from "@/lib/forms";
import { getPurposes } from "@/lib/purposes";
import { createOrder, fetchPayment, isRazorpayConfigured, verifyCheckoutSignature } from "@/lib/razorpay";
import { allowRequest, isBot } from "@/lib/security";
import { donation as limits } from "@/lib/site";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  amount: z.coerce
    .number({ error: "Please choose or enter an amount." })
    .int("Please enter a whole number of rupees.")
    .min(limits.min, `The minimum donation is ₹${limits.min}.`)
    .max(limits.max, `For donations above ₹${limits.max.toLocaleString("en-IN")} please contact us.`),
  purpose: z.string().min(1, "Please choose where your donation should go."),
  donor_name: z.string().trim().min(2, "Please enter your full name.").max(120),
  email: z.email("Please enter a valid email address."),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{7,16}$/, "Please enter a valid mobile number."),
  address: z.string().trim().max(500).optional().default(""),
  pan: z.union([
    z.literal(""),
    z.string().trim().toUpperCase().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Please enter a valid PAN, e.g. ABCDE1234F."),
  ]),
  display_anonymous: z.string().optional(),
  comms_consent: z.string().optional(),
  terms: z.literal("on", { error: "Please accept the donation policy to continue." }),
});

export type CheckoutResult = FormState & {
  checkout?: {
    keyId: string;
    orderId: string;
    amountPaise: number;
    donationId: string;
    token: string;
    name: string;
    email: string;
    phone: string;
  };
};

/** Creates a pending donation and a matching gateway order (journey steps 2–3). */
export async function createDonation(_prev: CheckoutResult, formData: FormData): Promise<CheckoutResult> {
  if (isBot(formData)) return { ok: false, message: "Unable to start the payment." };

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return validationFailure(parsed.error, formData);

  const d = parsed.data;
  const purposes = await getPurposes();
  if (!purposes.some((p) => p.slug === d.purpose)) {
    return validationFailure(new z.ZodError([{ code: "custom", path: ["purpose"], message: "Please choose a valid purpose.", input: d.purpose }]), formData);
  }
  if (!isSupabaseConfigured || !isRazorpayConfigured) {
    return { ...genericFailure(formData), message: "Online donations are not available right now. Please contact us to donate." };
  }
  if (!(await allowRequest("donate", 10, 600))) return rateLimited(formData);

  const db = supabaseAdmin();
  const { data: row, error } = await db
    .from("donations")
    .insert({
      amount_paise: d.amount * 100,
      purpose: d.purpose,
      donor_name: d.donor_name,
      email: d.email,
      phone: d.phone,
      address: d.address || null,
      pan: d.pan || null,
      display_anonymous: d.display_anonymous === "on",
      comms_consent: d.comms_consent === "on",
    })
    .select("id,receipt_token")
    .single();
  if (error || !row) {
    console.error("donation insert failed", error?.message);
    return genericFailure(formData);
  }

  try {
    const order = await createOrder(d.amount * 100, row.id.slice(0, 40), { donation_id: row.id, purpose: d.purpose });
    await db.from("donations").update({ gateway_order_id: order.id }).eq("id", row.id);
    return {
      ok: true,
      checkout: {
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        orderId: order.id,
        amountPaise: order.amount,
        donationId: row.id,
        token: row.receipt_token,
        name: d.donor_name,
        email: d.email,
        phone: d.phone,
      },
    };
  } catch (err) {
    console.error(err);
    await db.from("donations").update({ status: "failed", failure_reason: "order_create_failed" }).eq("id", row.id);
    return genericFailure(formData);
  }
}

/**
 * Called after Razorpay Checkout returns. The browser's signature is checked,
 * then the payment is confirmed with the gateway server-to-server before the
 * donation is marked successful. The webhook remains the backstop.
 */
export async function verifyCheckout(input: {
  donationId: string;
  token: string;
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<{ redirect: string }> {
  const d = await getDonationForToken(input.donationId, input.token);
  if (!d || d.gateway_order_id !== input.orderId) return { redirect: "/donate" };
  const path = statusPath(d);

  if (!verifyCheckoutSignature(input.orderId, input.paymentId, input.signature)) return { redirect: path };

  try {
    const payment = await fetchPayment(input.paymentId);
    if (payment.order_id !== d.gateway_order_id || payment.amount !== d.amount_paise) return { redirect: path };
    if (payment.status === "captured") {
      await confirmDonation(d.gateway_order_id, payment.id, payment.method);
    } else if (payment.status === "authorized") {
      await supabaseAdmin().from("donations").update({ status: "pending", method: payment.method }).eq("id", d.id).eq("status", "created");
    }
  } catch (err) {
    console.error("payment verification failed", err);
  }
  return { redirect: path };
}

/** Records that the donor closed the payment window or the payment failed. */
export async function abandonDonation(input: { donationId: string; token: string; outcome: "cancelled" | "failed"; reason?: string }) {
  const d = await getDonationForToken(input.donationId, input.token);
  if (!d) return { redirect: "/donate" };
  await supabaseAdmin()
    .from("donations")
    .update({ status: input.outcome, failure_reason: input.reason?.slice(0, 300) ?? null })
    .eq("id", d.id)
    .eq("status", "created");
  return { redirect: statusPath(d) };
}
