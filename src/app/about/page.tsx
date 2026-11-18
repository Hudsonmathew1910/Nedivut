import type { Metadata } from "next";
import Link from "next/link";
import { ArtTile, DonateBand, PageHero, SectionHeading } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About us: supporting children's education in India",
  description: "Nedivut Charitable Trust is an India-based charitable trust dedicated to children's education, care and development. Learn about our purpose, values and governance.",
};

const principles = [
  { title: "Dignity first", body: "We protect the privacy of every person we support. No beneficiary is identified publicly without informed consent." },
  { title: "Accountability", body: "Every rupee is recorded, every donation receipted, and every public figure verified before it is published." },
  { title: "Long-term care", body: "We stay with students over time, because lasting change in a child's education rarely happens in a single payment." },
  { title: "Local roots", body: "We work alongside schools, colleges, volunteers and local organisations in the communities we serve." },
];

export default function AboutPage() {
  const legal = [
    ["Legal name", site.legal.legalName],
    ["Registered address", site.legal.registeredAddress],
    ["Registration", site.legal.registration],
    ["PAN", site.legal.pan],
    ["80G approval", site.legal.section80G],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <>
      <PageHero
        eyebrow="About Nedivut"
        title="Every child deserves the chance to learn, grow and shape their own future."
        intro="Nedivut is an India-based charitable trust dedicated to children's education, care and development. Through education support, mentorship and community engagement, we help children continue their studies, build confidence and work towards a brighter future."
      />

      <section className="container-page grid gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading eyebrow="Our purpose" title="Why we exist" />
          <div className="prose-page mt-6">
            <p>
              For many children in India, school fees, a lack of learning resources and limited access to guidance can
              interrupt their education. We believe these barriers should never decide a child&apos;s future.
            </p>
            <p>
              Nedivut Charitable Trust exists to support children&apos;s education, well-being and personal development.
              Through educational support, child welfare initiatives, student mentorship and community engagement, we aim
              to help children stay in education, discover their strengths and build the skills to move forward.
            </p>
          </div>
        </div>
        <ArtTile variant={0} className="aspect-4/3 rounded-3xl" label="Brand illustration: a rising sun over leaves and an open book" />
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Operating principles" title="How we work" center />
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {principles.map((p) => (
              <div key={p.title} className="rounded-2xl bg-cream p-6 ring-1 ring-teal-900/5">
                <h3 className="font-display text-xl text-teal-900">{p.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-20">
        <SectionHeading eyebrow="Governance" title="Trust details" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="prose-page">
            <p>
              The trust is governed by its founder and trustees, who approve programmes, policies, public impact figures and
              the use of funds. Finance and compliance matters are reviewed with a qualified chartered accountant.
            </p>
            <p>
              Questions about our governance or finances are welcome. <Link href="/contact" className="font-semibold text-teal-700 underline">Contact us</Link>.
            </p>
          </div>
          <dl className="card divide-y divide-teal-900/10">
            {legal.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:justify-between">
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="font-medium text-ink">{v}</dd>
              </div>
            ))}
            {legal.length < 3 && (
              <p className="pt-3 text-sm text-muted">Registration and tax-exemption details will be published here once officially confirmed.</p>
            )}
          </dl>
        </div>
      </section>

      <DonateBand />
    </>
  );
}
