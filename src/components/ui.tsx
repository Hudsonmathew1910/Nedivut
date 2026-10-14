import Link from "next/link";
import type { ReactNode } from "react";

/** Inner-page hero on the brand teal, with the leaf motif in the corner. */
export function PageHero({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-teal-900 text-cream">
      <LeafPattern className="absolute -right-24 -bottom-28 h-96 w-96 text-teal-800" />
      <div className="container-page relative py-16 sm:py-20">
        <p className="text-xs font-semibold tracking-[0.18em] text-gold-300 uppercase">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-cream/80">{intro}</p>}
        {children}
      </div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, intro, center = false }: { eyebrow: string; title: string; intro?: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl leading-tight text-teal-900 sm:text-4xl">{title}</h2>
      {intro && <p className="mt-4 text-lg leading-relaxed text-muted">{intro}</p>}
    </div>
  );
}

export function LeafPattern({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="currentColor" aria-hidden="true">
      <circle cx="100" cy="46" r="20" opacity="0.7" />
      <path d="M96 128c-9-28-28-44-56-56 3 28 22 47 56 56Z" />
      <path d="M104 128c9-28 28-44 56-56-3 28-22 47-56 56Z" />
      <path d="M22 140c30-1 52 5 78 18 26-13 48-19 78-18l3 9c-29-1-51 5-81 20-30-15-52-21-81-20Z" />
    </svg>
  );
}

/** Closing call-to-action band used across pages. */
export function DonateBand() {
  return (
    <section className="container-page py-16">
      <div className="relative overflow-hidden rounded-3xl bg-teal-900 px-6 py-12 text-cream sm:px-12">
        <LeafPattern className="absolute -top-10 -right-10 h-64 w-64 text-teal-800" />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl leading-tight">Every contribution helps a student stay in school.</h2>
            <p className="mt-3 text-cream/75">Give securely by UPI, card or net banking and receive an instant e-receipt.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/donate" className="btn-gold">
              Donate now
            </Link>
            <Link href="/request-support" className="btn-outline-light">
              Request support
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Image-led placeholder tile in brand colours, used until consented photography is uploaded. */
export function ArtTile({ variant = 0, label, className = "" }: { variant?: number; label?: string; className?: string }) {
  const palettes = [
    ["bg-teal-800", "text-teal-700", "text-gold-500"],
    ["bg-gold-100", "text-gold-300", "text-teal-900"],
    ["bg-teal-100", "text-teal-200", "text-gold-600"],
    ["bg-teal-950", "text-teal-900", "text-gold-500"],
  ];
  const [bg, leaf, accent] = palettes[variant % palettes.length];
  return (
    <div className={`relative overflow-hidden ${bg} ${className}`} role={label ? "img" : undefined} aria-label={label}>
      <LeafPattern className={`absolute inset-x-0 -bottom-6 mx-auto h-[85%] w-[85%] ${leaf}`} />
      <svg viewBox="0 0 100 100" className={`absolute top-6 right-6 h-10 w-10 ${accent}`} aria-hidden="true">
        <circle cx="50" cy="50" r="50" fill="currentColor" />
      </svg>
    </div>
  );
}
