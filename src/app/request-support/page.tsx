import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { documentTypes } from "@/lib/site";
import { SupportForm } from "./support-form";

export const metadata: Metadata = {
  title: "Request education support",
  description: "Students, parents, guardians and referrers can request education support from Nedivut Charitable Trust.",
};

const steps = [
  { title: "Submit", body: "Fill in the form and upload the documents. You will receive a reference number straight away." },
  { title: "Screening", body: "Our team checks the request and may contact you for more information or documents." },
  { title: "Review", body: "Authorised trustees review verified requests and make a decision." },
  { title: "Decision", body: "We contact you with the outcome. Approved support is usually paid directly to the institution." },
];

export default function RequestSupportPage() {
  return (
    <>
      <PageHero
        eyebrow="Education support"
        title="Request support for a student's education"
        intro="If a student is struggling to pay school or college fees or other learning costs, we would like to hear from you. Every request is reviewed carefully and kept confidential."
      />

      <section className="container-page grid gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_1.6fr]">
        <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
          <div>
            <h2 className="font-display text-2xl text-teal-900">Who can apply</h2>
            <ul className="mt-4 space-y-2 text-ink/85">
              <li>Students in school, college or vocational courses</li>
              <li>Parents or legal guardians on a student&apos;s behalf</li>
              <li>Teachers or organisations referring a student</li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl text-teal-900">Documents you will need</h2>
            <ul className="mt-4 space-y-2 text-ink/85">
              {documentTypes.map((d) => (
                <li key={d.value}>
                  {d.label}
                  {(d.value === "fee_statement" || d.value === "identity") && <span className="text-sm text-gold-700"> (required)</span>}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl text-teal-900">What happens next</h2>
            <ol className="mt-4 space-y-4">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-teal-900 text-sm font-semibold text-cream">{i + 1}</span>
                  <div>
                    <p className="font-semibold text-ink">{s.title}</p>
                    <p className="text-sm leading-relaxed text-muted">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-2xl bg-gold-100 p-5 text-sm leading-relaxed text-ink/85">
            <p className="font-semibold text-ink">Please note</p>
            <p className="mt-1">
              Submitting a request does not guarantee assistance. Your details and documents are seen only by authorised
              trust members and are never published.
            </p>
          </div>
        </aside>
        <SupportForm />
      </section>
    </>
  );
}
