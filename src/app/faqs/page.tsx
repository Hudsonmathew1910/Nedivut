import type { Metadata } from "next";
import Link from "next/link";
import { DonateBand, PageHero } from "@/components/ui";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Answers to common questions about donating to and requesting support from Nedivut Charitable Trust.",
};

const faqs: { group: string; items: { q: string; a: string }[] }[] = [
  {
    group: "Donations",
    items: [
      { q: "How can I donate?", a: "Use the Donate page to give by UPI, debit or credit card, net banking or other methods offered by our payment partner. Payments are processed by the gateway; Nedivut never sees or stores your card details." },
      { q: "Will I get a receipt?", a: "Yes. As soon as the payment gateway confirms your payment, a receipt is generated with a unique number. You can download it on the confirmation page and we also email it to you." },
      { q: "Is my donation tax-deductible under Section 80G?", a: "Not yet. Our receipts are donation acknowledgements. If the trust receives 80G approval, this will be stated clearly on the receipt and this answer will be updated." },
      { q: "Can I choose where my money goes?", a: "Yes. Choose a programme on the donation form, or give to the general fund so we can direct support where it is needed most." },
      { q: "Can I donate anonymously?", a: "You can ask us not to display your name publicly. We still need your name and contact details privately to issue your receipt and meet legal requirements." },
      { q: "Something went wrong with my payment. What should I do?", a: "If money was debited but you did not see a confirmation, please wait a few minutes; the gateway confirms payments directly with us. If you still have no receipt, contact us with your transaction reference." },
    ],
  },
  {
    group: "Education support",
    items: [
      { q: "Who can request education support?", a: "Students, parents, legal guardians or authorised referrers such as teachers can submit a request for a student's school or college education." },
      { q: "Does submitting a request guarantee help?", a: "No. Every request is reviewed carefully, and support depends on eligibility, verification and available funds." },
      { q: "Is the information I share kept private?", a: "Yes. Your request and documents are visible only to authorised trust members reviewing it. We never publish applicant details." },
      { q: "How is support paid?", a: "Wherever possible, support is paid directly to the school or college. The trust does not make cash payouts through the website." },
    ],
  },
];

export default function FaqsPage() {
  return (
    <>
      <PageHero eyebrow="FAQs" title="Frequently asked questions" />
      <div className="container-page max-w-3xl space-y-14 py-16 sm:py-20">
        {faqs.map((g) => (
          <section key={g.group}>
            <h2 className="font-display text-2xl text-teal-900">{g.group}</h2>
            <div className="mt-6 divide-y divide-teal-900/10 rounded-2xl bg-white ring-1 ring-teal-900/5">
              {g.items.map((f) => (
                <details key={f.q} className="group px-6 py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                    {f.q}
                    <span className="text-xl text-gold-600 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
        <p className="text-muted">
          Still have a question? <Link href="/contact" className="font-semibold text-teal-700 underline">Get in touch</Link>.
        </p>
      </div>
      <DonateBand />
    </>
  );
}
