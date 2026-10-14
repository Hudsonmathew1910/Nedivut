import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { getPurposes } from "@/lib/purposes";
import { site } from "@/lib/site";
import { DonateForm } from "./donate-form";

export const metadata: Metadata = {
  title: "Donate",
  description: "Donate securely to Nedivut Charitable Trust by UPI, card or net banking and receive an instant e-receipt.",
};

const assurances = [
  { title: "Secure payment", body: "Payments are processed by Razorpay, a regulated payment gateway. We never see or store your card details." },
  { title: "Instant receipt", body: "A numbered receipt is generated as soon as your payment is confirmed, and emailed to you." },
  { title: "Your choice", body: "Give to a specific programme, or to the general fund so we can direct support where it is needed most." },
];

export default async function DonatePage() {
  const purposes = await getPurposes();
  return (
    <>
      <PageHero
        eyebrow="Donate"
        title="Your gift helps a young mind grow"
        intro="Every donation, whatever its size, goes to the work of the trust: education, child welfare, elder care and community development."
      />
      <section className="container-page grid gap-10 py-16 sm:py-20 lg:grid-cols-[1.5fr_1fr]">
        <DonateForm purposes={purposes} />
        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          {assurances.map((a) => (
            <div key={a.title} className="rounded-2xl bg-white p-6 ring-1 ring-teal-900/5">
              <h2 className="font-display text-lg text-teal-900">{a.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{a.body}</p>
            </div>
          ))}
          <div className="rounded-2xl bg-gold-100 p-6 text-sm leading-relaxed text-ink/85">
            <p className="font-semibold text-ink">About tax deductions</p>
            <p className="mt-1">
              {site.legal.section80G
                ? `Donations are eligible for deduction under Section 80G (${site.legal.section80G}). Please add your PAN to receive an 80G receipt.`
                : "Our receipts are donation acknowledgements. They are not 80G tax-deduction certificates at this time."}
            </p>
          </div>
          <p className="text-sm text-muted">
            Prefer to give by bank transfer or cheque? Write to{" "}
            <a href={`mailto:${site.contact.email}`} className="font-semibold text-teal-700 underline">
              {site.contact.email}
            </a>
            .
          </p>
        </aside>
      </section>
    </>
  );
}
