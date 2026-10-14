"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Checkbox, Field, FormAlert, Honeypot, fieldProps } from "@/components/form";
import { donation } from "@/lib/site";
import { abandonDonation, createDonation, verifyCheckout, type CheckoutResult } from "./actions";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open(): void; on(event: string, cb: (r: { error?: { description?: string } }) => void): void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadCheckout(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function DonateForm({ purposes }: { purposes: { slug: string; label: string }[] }) {
  const router = useRouter();
  const [state, action, creating] = useActionState(createDonation, {} as CheckoutResult);
  const [amount, setAmount] = useState<string>(state.values?.amount ?? "2500");
  const purposeRef = useRef<HTMLSelectElement>(null);
  const [message, setMessage] = useState("");
  const [redirecting, startRedirect] = useTransition();
  const opened = useRef<string | null>(null);

  // Programme pages link here with ?purpose=… (read after mount so the form stays prerendered).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("purpose");
    if (q && purposeRef.current && purposes.some((p) => p.slug === q)) purposeRef.current.value = q;
  }, [purposes]);

  useEffect(() => {
    const c = state.checkout;
    if (!c || opened.current === c.orderId) return;
    opened.current = c.orderId;

    const go = (p: Promise<{ redirect: string }>) => startRedirect(async () => router.push((await p).redirect));

    loadCheckout().then((ok) => {
      if (!ok || !window.Razorpay) {
        setMessage("We could not load the secure payment window. Please check your connection and try again.");
        return;
      }
      let settled = false;
      const rzp = new window.Razorpay({
        key: c.keyId,
        order_id: c.orderId,
        amount: c.amountPaise,
        currency: "INR",
        name: "Nedivut Charitable Trust",
        description: "Donation",
        prefill: { name: c.name, email: c.email, contact: c.phone },
        theme: { color: "#0f4643" },
        handler: (r: RazorpayResponse) => {
          settled = true;
          go(verifyCheckout({ donationId: c.donationId, token: c.token, orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }));
        },
        modal: {
          ondismiss: () => {
            if (!settled) go(abandonDonation({ donationId: c.donationId, token: c.token, outcome: "cancelled" }));
          },
        },
      });
      rzp.on("payment.failed", (r) => {
        setMessage(r.error?.description ? `Payment failed: ${r.error.description}. You can try again in the payment window.` : "Payment failed. You can try again in the payment window.");
      });
      rzp.open();
    });
  }, [state.checkout, router]);

  const busy = creating || redirecting;

  return (
    <form action={action} className="card relative space-y-8" noValidate>
      <Honeypot />
      <FormAlert state={state} />
      {message && (
        <div role="alert" className="rounded-xl border border-gold-300 bg-gold-100 px-4 py-3 text-sm text-ink">
          {message}
        </div>
      )}

      <fieldset>
        <legend className="font-display text-xl text-teal-900">Choose an amount</legend>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {donation.presets.map((v) => {
            const active = String(v) === amount;
            return (
              <button
                key={v}
                type="button"
                aria-pressed={active}
                onClick={() => setAmount(String(v))}
                className={`rounded-xl px-3 py-3 text-sm font-semibold ring-1 transition ${active ? "bg-teal-900 text-cream ring-teal-900" : "bg-white text-teal-900 ring-teal-900/20 hover:bg-teal-50"}`}
              >
                ₹{v.toLocaleString("en-IN")}
              </button>
            );
          })}
        </div>
        <div className="mt-4">
          <Field name="amount" label="Or enter another amount (₹)" state={state} required>
            <input
              id="amount"
              name="amount"
              type="number"
              inputMode="numeric"
              min={donation.min}
              max={donation.max}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={Boolean(state.errors?.amount) || undefined}
              className="field-input sm:max-w-xs"
              required
            />
          </Field>
        </div>
      </fieldset>

      <Field name="purpose" label="Where should it go?" state={state} required>
        <select ref={purposeRef} {...fieldProps("purpose", state)} className="field-input" required>
          {purposes.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>

      <fieldset className="space-y-5">
        <legend className="font-display text-xl text-teal-900">Your details</legend>
        <p className="text-sm text-muted">We need these to send your receipt.</p>
        <Field name="donor_name" label="Full name (as on receipt)" state={state} required>
          <input {...fieldProps("donor_name", state)} className="field-input" autoComplete="name" required />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="email" label="Email" state={state} required>
            <input {...fieldProps("email", state)} type="email" className="field-input" autoComplete="email" required />
          </Field>
          <Field name="phone" label="Mobile number" state={state} required>
            <input {...fieldProps("phone", state)} type="tel" className="field-input" autoComplete="tel" required />
          </Field>
        </div>
        <details className="rounded-xl bg-cream p-4" open={Boolean(state.errors?.pan || state.values?.pan || state.values?.address)}>
          <summary className="cursor-pointer text-sm font-semibold text-teal-900">Add PAN and address for your receipt (optional)</summary>
          <div className="mt-4 space-y-5">
            <Field name="pan" label="PAN" state={state}>
              <input {...fieldProps("pan", state)} className="field-input uppercase sm:max-w-xs" maxLength={10} autoComplete="off" />
            </Field>
            <Field name="address" label="Postal address" state={state}>
              <textarea {...fieldProps("address", state)} rows={2} className="field-input" autoComplete="street-address" />
            </Field>
          </div>
        </details>
      </fieldset>

      <div className="space-y-4">
        <Checkbox name="display_anonymous" state={state}>
          Please do not show my name publicly (we still keep it privately for your receipt).
        </Checkbox>
        <Checkbox name="comms_consent" state={state}>
          Send me occasional updates about the trust&apos;s work.
        </Checkbox>
        <Checkbox name="terms" state={state} required>
          I have read the{" "}
          <Link href="/policies/donation-refund" className="font-semibold text-teal-700 underline" target="_blank">
            donation and refund policy
          </Link>{" "}
          and{" "}
          <Link href="/policies/privacy" className="font-semibold text-teal-700 underline" target="_blank">
            privacy notice
          </Link>
          .
        </Checkbox>
      </div>

      <div>
        <button type="submit" className="btn-gold w-full py-4 text-base" disabled={busy}>
          {busy ? "Please wait…" : `Donate ₹${Number(amount || 0).toLocaleString("en-IN")} securely`}
        </button>
        <p className="mt-3 text-center text-xs text-muted">
          UPI, cards and net banking via Razorpay. Your card details never reach Nedivut.
        </p>
      </div>
    </form>
  );
}
