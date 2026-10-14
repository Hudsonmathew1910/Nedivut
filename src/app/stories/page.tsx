import type { Metadata } from "next";
import Link from "next/link";
import { ArtTile, DonateBand, PageHero, SectionHeading } from "@/components/ui";
import { programmes } from "@/lib/site";

export const metadata: Metadata = {
  title: "Stories and gallery",
  description: "Stories, photographs and updates from the work of Nedivut Charitable Trust.",
};

export default function StoriesPage() {
  return (
    <>
      <PageHero
        eyebrow="Stories and gallery"
        title="Moments from the field"
        intro="Photographs and stories from our programmes, shared with the informed consent of the people in them."
      />

      <section className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow="Coming soon"
          title="Our first stories are on their way"
          intro="We are gathering photographs and stories with the written consent of the people in them. They will appear here, grouped by programme."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {programmes.map((p, i) => (
            <figure key={p.slug} className="overflow-hidden rounded-2xl bg-white ring-1 ring-teal-900/5">
              <ArtTile variant={i} className="aspect-square" />
              <figcaption className="p-4">
                <p className="font-display text-teal-900">{p.title}</p>
                <p className="text-sm text-muted">Album coming soon</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Consent and safeguarding" title="Why you will not see everything" />
          </div>
          <div className="prose-page">
            <p>
              We publish a photograph or story only after the person, or for a child their parent or guardian, has given
              written consent. Images of children and vulnerable adults go through an additional review.
            </p>
            <p>
              Anyone can ask us to remove an image of themselves or their child at any time, and we will take it down from
              the entire website. See our <Link href="/policies/safeguarding" className="font-semibold text-teal-700 underline">safeguarding policy</Link>.
            </p>
          </div>
        </div>
      </section>

      <DonateBand />
    </>
  );
}
