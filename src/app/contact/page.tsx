import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui";
import { site } from "@/lib/site";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Nedivut Charitable Trust, Coimbatore.",
};

export default function ContactPage() {
  const c = site.contact;
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We would love to hear from you"
        intro="Whether you want to donate, volunteer, partner with us or ask about education support, write to us and the right person will respond."
      />
      <section className="container-page grid gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-8">
          <div>
            <h2 className="font-display text-2xl text-teal-900">Reach us directly</h2>
            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-sm text-muted">Email</dt>
                <dd>
                  <a href={`mailto:${c.email}`} className="font-semibold text-teal-700 hover:underline">
                    {c.email}
                  </a>
                </dd>
              </div>
              {c.phone && (
                <div>
                  <dt className="text-sm text-muted">Phone</dt>
                  <dd>
                    <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="font-semibold text-teal-700 hover:underline">
                      {c.phone}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-muted">Office</dt>
                <dd className="font-medium">{c.address}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Hours</dt>
                <dd className="font-medium">{c.hours}</dd>
              </div>
            </dl>
          </div>
          {c.whatsapp && (
            <a href={`https://wa.me/${c.whatsapp}`} className="btn-outline" target="_blank" rel="noopener noreferrer">
              Chat on WhatsApp
            </a>
          )}
          {site.social.length > 0 && (
            <ul className="flex flex-wrap gap-4">
              {site.social.map((s) => (
                <li key={s.href}>
                  <a href={s.href} className="font-semibold text-teal-700 hover:underline" target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <div className="rounded-2xl bg-gold-100 p-5 text-sm leading-relaxed text-ink/85">
            Looking for help with school or college fees? Please use the{" "}
            <Link href="/request-support" className="font-semibold text-teal-800 underline">
              education support request form
            </Link>{" "}
            so that your documents are handled securely.
          </div>
        </div>
        <ContactForm />
      </section>
    </>
  );
}
