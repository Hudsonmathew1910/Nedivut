import { confirmDonation } from "@/lib/donations";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

type Entity = { id: string; order_id?: string; payment_id?: string; method?: string; error_description?: string };
type WebhookBody = {
  event: string;
  payload: { payment?: { entity: Entity }; order?: { entity: Entity }; refund?: { entity: Entity } };
};

/**
 * Razorpay webhook (configure in Dashboard → Webhooks with events
 * payment.captured, payment.failed, order.paid, refund.processed,
 * payment.dispute.created). Signature-verified and idempotent per event id.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) {
    return Response.json({ error: "invalid signature" }, { status: 401 });
  }
  if (!isSupabaseConfigured) return Response.json({ error: "not configured" }, { status: 503 });

  const body = JSON.parse(raw) as WebhookBody;
  const eventId = request.headers.get("x-razorpay-event-id") ?? `${body.event}:${body.payload.payment?.entity.id ?? body.payload.refund?.entity.id}`;
  const db = supabaseAdmin();

  const { error: dup } = await db.from("payment_events").insert({ event_id: eventId, event_type: body.event, payload: body });
  if (dup) {
    // 23505 = unique violation: this delivery was already processed.
    if (dup.code === "23505") return Response.json({ ok: true, duplicate: true });
    console.error("payment event insert failed", dup.message);
    return Response.json({ error: "storage failed" }, { status: 500 });
  }

  const payment = body.payload.payment?.entity;
  try {
    switch (body.event) {
      case "payment.captured":
      case "order.paid":
        if (payment?.order_id) await confirmDonation(payment.order_id, payment.id, payment.method ?? null);
        break;
      case "payment.failed":
        if (payment?.order_id)
          await db
            .from("donations")
            .update({ status: "failed", failure_reason: payment.error_description ?? null })
            .eq("gateway_order_id", payment.order_id)
            .in("status", ["created", "pending", "cancelled"]);
        break;
      case "refund.processed": {
        const paymentId = body.payload.refund?.entity.payment_id;
        if (paymentId) await db.from("donations").update({ status: "refunded" }).eq("gateway_payment_id", paymentId);
        break;
      }
      case "payment.dispute.created":
        if (payment?.id) await db.from("donations").update({ status: "chargeback" }).eq("gateway_payment_id", payment.id);
        break;
    }
  } catch (err) {
    console.error("webhook processing failed", err);
    // Allow Razorpay to retry: forget this delivery so the retry is processed.
    await db.from("payment_events").delete().eq("event_id", eventId);
    return Response.json({ error: "processing failed" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
