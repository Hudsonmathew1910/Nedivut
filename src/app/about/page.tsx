import type { Metadata } from "next";
import Link from "next/link";
import { ArtTile, DonateBand, PageHero, SectionHeading } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About us",
  description: "The purpose, values and governance of Nedivut Charitable Trust, Coimbatore.",
};

const principles = [
  { title: "Dignity first", body: "We protect the privacy of every person we support. No beneficiary is identified publicly without informed consent." },
  { title: "Accountability", body: "Every rupee is recorded, every donation receipted, and every public figure verified before it is published." },
  { title: "Long-term care", body: "We stay with students and families over time, because lasting change rarely happens in a single payment." },
  { title: "Local roots", body: "We work alongside schools, colleges, volunteers and community leaders in and around Coimbatore." },
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
        title="A charitable trust built on care and accountability"
        intro="Nedivut Charitable Trust is based in Coimbatore, Tamil Nadu. We support education, child welfare, elder care and community development, so that people can grow with dignity."
      />

      <section className="container-page grid gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading eyebrow="Our purpose" title="Why we exist" />
          <div className="prose-page mt-6">
            <p>
              Too many capable students leave their studies because a fee falls due at the wrong moment. Too many elders live
              without someone to check on them. Nedivut was founded to respond to needs like these: quietly, personally and
              with care.
            </p>
            <p>
              Our logo says it simply: a book opening into new leaves under a rising sun. Learning comes first, and growth follows.
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
