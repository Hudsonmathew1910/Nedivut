import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

export const isRazorpayConfigured = Boolean(keyId && keySecret);

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Razorpay ${path} failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export type RazorpayOrder = { id: string; amount: number; currency: string; status: string };
export type RazorpayPayment = {
  id: string;
  order_id: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method: string;
  amount: number;
  error_description?: string | null;
};

export function createOrder(amountPaise: number, receipt: string, notes: Record<string, string>) {
  return api<RazorpayOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, notes, payment_capture: 1 }),
  });
}

export function fetchPayment(paymentId: string) {
  return api<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

export function fetchOrderPayments(orderId: string) {
  return api<{ items: RazorpayPayment[] }>(`/orders/${encodeURIComponent(orderId)}/payments`);
}

function safeEqualHex(a: string, b: string) {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ab.length === bb.length && ab.length > 0 && timingSafeEqual(ab, bb);
}

/** Verifies the signature Razorpay Checkout returns to the browser. */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  if (!keySecret) return false;
  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Verifies the X-Razorpay-Signature header against the raw webhook body. */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  if (!webhookSecret) return false;
  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Groups gateway methods into the categories shown on receipts. */
export function methodCategory(method: string | null | undefined) {
  switch (method) {
    case "upi":
      return "UPI";
    case "card":
      return "Card";
    case "netbanking":
      return "Net banking";
    case "wallet":
      return "Wallet";
    default:
      return "Online";
  }
}
