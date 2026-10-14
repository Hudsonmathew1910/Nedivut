import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { PageHero } from "@/components/ui";
import { site } from "@/lib/site";

// Draft policy text. Every policy must be reviewed by the trust's legal or
// compliance adviser before launch (BRD: "Compliance and policy dependencies").
const policies: Record<string, { title: string; summary: string; body: ReactNode }> = {
  privacy: {
    title: "Privacy notice",
    summary: "How we collect, use and protect your personal information.",
    body: (
      <>
        <h2>What we collect</h2>
        <ul>
          <li>Donors: name, email, mobile number, and where needed for receipts, address and PAN. Payment details are handled by our payment gateway; we never receive or store card numbers.</li>
          <li>Education-support applicants: student and guardian details, education and institution details, household context and supporting documents.</li>
          <li>Enquiries: your name, contact details and message.</li>
        </ul>
        <h2>How we use it</h2>
        <p>We use your information only to process donations and issue receipts, review and respond to support requests, answer enquiries, and meet legal and accounting obligations. We do not sell or rent personal data.</p>
        <h2>Who can see it</h2>
        <p>Access is limited to authorised trust members who need it for their role. Applicant documents are visible only to authorised reviewers, and access is logged.</p>
        <h2>How we protect it</h2>
        <p>Data is encrypted in transit and at rest with our hosting and database providers. Documents are kept in private storage that is not publicly accessible.</p>
        <h2>Retention and your rights</h2>
        <p>We keep personal data only as long as necessary for the purpose and for legal requirements. You may ask to access, correct or delete your information, or withdraw consent, by writing to {site.contact.email}.</p>
      </>
    ),
  },
  terms: {
    title: "Terms of use",
    summary: "The terms that apply when you use this website.",
    body: (
      <>
        <h2>Use of this website</h2>
        <p>This website is operated by {site.legal.legalName}. By using it you agree to use it lawfully and not to misuse its forms or attempt to access information that is not intended for you.</p>
        <h2>Content</h2>
        <p>Content, images and the Nedivut name and logo belong to the trust or are used with permission. Please ask before reusing them.</p>
        <h2>Accuracy</h2>
        <p>We take care that information on this website is accurate and current. Impact figures are published only after verification and show the date they relate to.</p>
        <h2>Contact</h2>
        <p>Questions about these terms can be sent to {site.contact.email}.</p>
      </>
    ),
  },
  "donation-refund": {
    title: "Donation and refund policy",
    summary: "How donations are processed, receipted and, in exceptional cases, refunded.",
    body: (
      <>
        <h2>Donations</h2>
        <p>Donations are made voluntarily and are used for the purpose selected by the donor, or for the general work of the trust when the general fund is chosen.</p>
        <h2>Receipts</h2>
        <p>A receipt with a unique number is issued only after our payment gateway confirms the payment. Receipts are donation acknowledgements and are not tax-deduction certificates unless they state otherwise.</p>
        <h2>Refunds</h2>
        <p>If you donated in error (for example, a duplicate payment or a wrong amount), contact us within 7 days at {site.contact.email} with your transaction reference. Approved refunds are returned to the original payment method. Refunds are not normally possible once funds have been used.</p>
      </>
    ),
  },
  safeguarding: {
    title: "Safeguarding policy",
    summary: "How we protect children and vulnerable adults in everything we do.",
    body: (
      <>
        <h2>Our commitment</h2>
        <p>The safety and dignity of children and vulnerable adults come before any communication or fundraising goal.</p>
        <h2>Images and stories</h2>
        <ul>
          <li>We publish identifiable images or stories only with informed, written consent; for a child, from a parent or legal guardian.</li>
          <li>We never publish a beneficiary&apos;s full name with their location, school, or personal circumstances.</li>
          <li>Consent can be withdrawn at any time, and we will remove the material from the website.</li>
        </ul>
        <h2>Education requests for minors</h2>
        <p>Requests for students under 18 require the consent of a parent or legal guardian, and communication is with the guardian.</p>
        <h2>Raising a concern</h2>
        <p>If you have a safeguarding concern, write to {site.contact.email}. Concerns are handled confidentially and promptly by a designated trustee.</p>
      </>
    ),
  },
};

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = policies[slug];
  return p ? { title: p.title, description: p.summary } : {};
}

export default async function PolicyPage({ params }: PageProps<"/policies/[slug]">) {
  const { slug } = await params;
  const policy = policies[slug];
  if (!policy) notFound();

  return (
    <>
      <PageHero eyebrow="Policies" title={policy.title} intro={policy.summary} />
      <article className="container-page prose-page max-w-3xl py-14 sm:py-16">{policy.body}</article>
    </>
  );
}
