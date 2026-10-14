import Link from "next/link";
import { site } from "@/lib/site";
import { Logo } from "./logo";

const groups = [
  {
    title: "The trust",
    links: [
      { href: "/about", label: "About us" },
      { href: "/programmes", label: "Programmes" },
      { href: "/impact", label: "Impact" },
      { href: "/stories", label: "Stories and gallery" },
    ],
  },
  {
    title: "Get involved",
    links: [
      { href: "/donate", label: "Donate" },
      { href: "/request-support", label: "Request education support" },
      { href: "/contact", label: "Contact us" },
      { href: "/faqs", label: "FAQs" },
    ],
  },
  {
    title: "Policies",
    links: [
      { href: "/policies/privacy", label: "Privacy" },
      { href: "/policies/terms", label: "Terms of use" },
      { href: "/policies/donation-refund", label: "Donation and refund" },
      { href: "/policies/safeguarding", label: "Safeguarding" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-teal-950 text-cream">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/70">{site.tagline}.</p>
          <address className="mt-4 text-sm leading-relaxed text-cream/70 not-italic">
            {site.contact.address}
            <br />
            <a href={`mailto:${site.contact.email}`} className="hover:text-gold-300">
              {site.contact.email}
            </a>
            {site.contact.phone && (
              <>
                <br />
                <a href={`tel:${site.contact.phone.replace(/\s/g, "")}`} className="hover:text-gold-300">
                  {site.contact.phone}
                </a>
              </>
            )}
          </address>
        </div>
        {groups.map((g) => (
          <nav key={g.title} aria-label={g.title}>
            <h2 className="text-sm font-semibold text-gold-300">{g.title}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-cream/75 hover:text-cream">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-cream/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-cream/55 sm:flex-row sm:justify-between">
          <p>© {site.legal.legalName}. All rights reserved.</p>
          <p>Payments are processed securely by our payment partner. We never store card details.</p>
        </div>
      </div>
    </footer>
  );
}
