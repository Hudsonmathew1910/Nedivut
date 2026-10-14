import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LogoMark } from "@/components/logo";
import { getDonationForToken, receiptPath, reconcileDonation } from "@/lib/donations";
import { isSupabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Donation status",
  robots: { index: false, follow: false },
};

async function Status({ searchParams }: { searchParams: PageProps<"/donate/status">["searchParams"] }) {
  const sp = await searchParams;
  const id = typeof sp.d === "string" ? sp.d : "";
  const token = typeof sp.t === "string" ? sp.t : "";

  let donation = isSupabaseConfigured ? await getDonationForToken(id, token) : null;
  if (!donation) {
    return (
      <Panel title="We could not find this donation" tone="neutral">
        <p>The link may be incomplete. If you were charged, please contact us with your transaction reference.</p>
        <Actions primary={{ href: "/contact", label: "Contact us" }} />
      </Panel>
    );
  }

  donation = await reconcileDonation(donation);
  const amount = `₹${(donation.amount_paise / 100).toLocaleString("en-IN")}`;

  switch (donation.status) {
    case "success":
      return (
        <Panel title="Thank you for your donation" tone="success">
          <p>
            We have received your donation of <strong>{amount}</strong>. Your receipt number is{" "}
            <strong className="font-mono">{donation.receipt_no}</strong>, and a copy has been sent to {donation.email}.
          </p>
          <Actions primary={{ href: receiptPath(donation), label: "Download receipt (PDF)", download: true }} secondary={{ href: "/", label: "Back to home" }} />
        </Panel>
      );
    case "created":
    case "pending":
      return (
        <Panel title="Your payment is being confirmed" tone="neutral">
          <p>
            We are waiting for the payment gateway to confirm your donation of {amount}. This usually takes a few seconds, but
            some UPI and bank payments can take longer. Please do not pay again.
          </p>
          <p>Refresh this page in a minute. Your receipt will also be emailed to you once the payment is confirmed.</p>
          <Actions secondary={{ href: "/contact", label: "Need help?" }} />
        </Panel>
      );
    case "cancelled":
      return (
        <Panel title="Payment cancelled" tone="warning">
          <p>The payment window was closed before the payment was completed. No money has been taken.</p>
          <Actions primary={{ href: "/donate", label: "Try again" }} secondary={{ href: "/contact", label: "Contact us" }} />
        </Panel>
      );
    case "failed":
      return (
        <Panel title="Payment not completed" tone="warning">
          <p>
            Your payment did not go through. If money was debited from your account, it is usually refunded automatically by
            your bank within 5–7 working days.
          </p>
          <Actions primary={{ href: "/donate", label: "Try again" }} secondary={{ href: "/contact", label: "Contact us" }} />
        </Panel>
      );
    default:
      return (
        <Panel title="This donation has been refunded" tone="neutral">
          <p>If you have questions about this refund, please contact us.</p>
          <Actions primary={{ href: "/contact", label: "Contact us" }} />
        </Panel>
      );
  }
}

function Panel({ title, tone, children }: { title: string; tone: "success" | "warning" | "neutral"; children: React.ReactNode }) {
  const ring = { success: "ring-teal-700/30", warning: "ring-gold-500/50", neutral: "ring-teal-900/10" }[tone];
  return (
    <div role="status" className={`card mx-auto max-w-xl text-center ring-2 ${ring}`}>
      <LogoMark className="mx-auto h-14 w-14" />
      <h1 className="mt-5 font-display text-3xl text-teal-900">{title}</h1>
      <div className="mt-4 space-y-3 leading-relaxed text-muted">{children}</div>
    </div>
  );
}

function Actions({ primary, secondary }: { primary?: { href: string; label: string; download?: boolean }; secondary?: { href: string; label: string } }) {
  return (
    <div className="flex flex-wrap justify-center gap-3 pt-4">
      {primary &&
        (primary.download ? (
          <a href={primary.href} className="btn-gold">
            {primary.label}
          </a>
        ) : (
          <Link href={primary.href} className="btn-teal">
            {primary.label}
          </Link>
        ))}
      {secondary && (
        <Link href={secondary.href} className="btn-outline">
          {secondary.label}
        </Link>
      )}
    </div>
  );
}

export default function StatusPage({ searchParams }: PageProps<"/donate/status">) {
  return (
    <section className="container-page py-16 sm:py-24">
      <Suspense fallback={<div className="card mx-auto h-72 max-w-xl animate-pulse" aria-label="Checking payment status" />}>
        <Status searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
