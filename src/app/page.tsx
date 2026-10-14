import Link from "next/link";
import { ImpactStats } from "@/components/impact-stats";
import { LogoMark } from "@/components/logo";
import { ArtTile, DonateBand, SectionHeading } from "@/components/ui";
import { programmes } from "@/lib/site";

const promises = [
  {
    title: "Transparent",
    body: "Verified impact figures with definitions and dates, and an instant receipt for every donation.",
  },
  {
    title: "Safe",
    body: "Beneficiary identities and documents stay private. Children's stories are shared only with guardian consent.",
  },
  {
    title: "Direct",
    body: "Education support is paid to institutions wherever possible, so help reaches its purpose.",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-teal-900 text-cream">
        <div className="container-page grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-gold-300 uppercase">Coimbatore · Tamil Nadu</p>
            <h1 className="mt-4 font-display text-4xl leading-[1.1] sm:text-6xl">
              Helping young minds grow, and every life <span className="text-gold-500">flourish</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/80">
              Nedivut Charitable Trust supports students, children, elders and communities with care that is
              accountable, personal and lasting.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/donate" className="btn-gold">
                Donate now
              </Link>
              <Link href="/request-support" className="btn-outline-light">
                Request education support
              </Link>
            </div>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-md">
            <div className="absolute inset-0 rounded-[2.5rem] bg-teal-800" />
            <LogoMark tile={false} className="absolute inset-6" />
            <div className="absolute -bottom-4 -left-4 rounded-2xl bg-cream px-5 py-4 text-ink shadow-xl">
              <p className="text-xs text-muted">Our promise</p>
              <p className="font-display text-lg text-teal-900">Rooted in care</p>
            </div>
          </div>
        </div>
      </section>

      {/* Promises */}
      <section className="container-page py-16 sm:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {promises.map((p, i) => (
            <div key={p.title} className="card">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold-100 font-display text-lg text-gold-700">
                {i + 1}
              </span>
              <h2 className="mt-4 font-display text-xl text-teal-900">{p.title}</h2>
              <p className="mt-2 leading-relaxed text-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Programmes */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-page">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              eyebrow="What we do"
              title="Four programmes, one purpose"
              intro="Education is at the heart of our work, alongside care for children, elders and the communities around them."
            />
            <Link href="/programmes" className="btn-outline self-start md:self-auto">
              All programmes
            </Link>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {programmes.map((p, i) => (
              <Link key={p.slug} href={`/programmes#${p.slug}`} className="group overflow-hidden rounded-2xl bg-cream ring-1 ring-teal-900/5 transition hover:-translate-y-1 hover:shadow-lg">
                <ArtTile variant={i} className="aspect-4/3" />
                <div className="p-5">
                  <h3 className="font-display text-lg text-teal-900 group-hover:text-teal-700">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{p.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="bg-teal-950 py-16 text-cream sm:py-20">
        <div className="container-page">
          <p className="text-xs font-semibold tracking-[0.18em] text-gold-300 uppercase">Our impact</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl leading-tight sm:text-4xl">Numbers we can stand behind</h2>
          <div className="mt-10">
            <ImpactStats dark />
          </div>
          <Link href="/impact" className="mt-8 inline-block text-sm font-semibold text-gold-300 underline-offset-4 hover:underline">
            How we measure impact →
          </Link>
        </div>
      </section>

      {/* Education support */}
      <section className="container-page grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2">
        <ArtTile variant={1} className="aspect-5/4 rounded-3xl" label="Illustration of leaves growing from an open book" />
        <div>
          <SectionHeading
            eyebrow="Education support"
            title="Is a student you know at risk of dropping out?"
            intro="Students, parents, guardians and referring teachers can request help with school or college fees and learning costs. Every request is reviewed carefully and kept confidential."
          />
          <ul className="mt-6 space-y-3 text-ink/85">
            {["Simple online form with secure document upload", "Private review by authorised trust members only", "Acknowledgement with a reference number"].map((t) => (
              <li key={t} className="flex gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 flex-none rounded-full bg-gold-500" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
          <Link href="/request-support" className="btn-teal mt-8">
            Check eligibility and apply
          </Link>
        </div>
      </section>

      <DonateBand />
    </>
  );
}
