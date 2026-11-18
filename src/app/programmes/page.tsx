import type { Metadata } from "next";
import Link from "next/link";
import { ArtTile, DonateBand, PageHero } from "@/components/ui";
import { programmes } from "@/lib/site";

export const metadata: Metadata = {
  title: "Programmes: education support, child welfare and student mentorship",
  description: "Nedivut Charitable Trust's programmes for children's education in India: Education Support, Child Welfare & Care, Student Mentorship & Development, and Community Development & Engagement.",
};

export default function ProgrammesPage() {
  return (
    <>
      <PageHero
        eyebrow="Our programmes"
        title="Supporting children's education, care and development"
        intro="Nedivut Charitable Trust brings together educational support, child welfare, student mentorship and community engagement to help children learn, build confidence and pursue their aspirations. Explore our four programmes and discover how you can contribute to a child's future."
      />

      <div className="container-page space-y-16 py-16 sm:space-y-24 sm:py-24">
        {programmes.map((p, i) => (
          <section key={p.slug} id={p.slug} className="grid scroll-mt-28 items-center gap-10 lg:grid-cols-2">
            <ArtTile variant={i} className={`aspect-4/3 rounded-3xl ${i % 2 ? "lg:order-2" : ""}`} />
            <div>
              <p className="eyebrow">Programme {i + 1}</p>
              <h2 className="mt-3 font-display text-3xl text-teal-900 sm:text-4xl">{p.title}</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted">{p.summary}</p>
              <ul className="mt-6 space-y-3">
                {p.points.map((pt) => (
                  <li key={pt} className="flex gap-3 text-ink/85">
                    <span className="mt-1.5 h-2.5 w-2.5 flex-none rounded-full bg-gold-500" aria-hidden="true" />
                    {pt}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={`/donate?purpose=${p.slug}`} className="btn-teal">
                  Donate to {p.title}
                </Link>
                {p.slug === "education" && (
                  <Link href="/request-support" className="btn-outline">
                    Request support
                  </Link>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>

      <DonateBand />
    </>
  );
}
