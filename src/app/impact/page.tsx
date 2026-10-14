import type { Metadata } from "next";
import { ImpactStats } from "@/components/impact-stats";
import { DonateBand, PageHero, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Impact",
  description: "Verified impact figures from Nedivut Charitable Trust, with definitions and as-of dates.",
};

const standards = [
  { title: "Defined", body: "Every figure comes with a plain-language definition of what is being counted." },
  { title: "Dated", body: "Every figure shows the date it was last verified, and figures are reviewed at least monthly." },
  { title: "Approved", body: "Figures are checked against our records and approved by the trustees before they appear here." },
  { title: "Private", body: "We never publish names, documents or details that could identify the people we support." },
];

export default function ImpactPage() {
  return (
    <>
      <PageHero
        eyebrow="Impact"
        title="Honest numbers, clearly defined"
        intro="We would rather show fewer numbers that are true than many that are not. Here is what we count, and how."
      />

      <section className="container-page py-16 sm:py-20">
        <ImpactStats detailed />
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Our standard" title="How we publish impact" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {standards.map((s) => (
              <div key={s.title} className="rounded-2xl bg-cream p-6 ring-1 ring-teal-900/5">
                <h3 className="font-display text-xl text-teal-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 max-w-3xl text-muted">
            Annual reports and audited statements will be published on this page as they become available.
          </p>
        </div>
      </section>

      <DonateBand />
    </>
  );
}
