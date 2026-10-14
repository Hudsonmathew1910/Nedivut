// Central site configuration. Values marked TODO must be confirmed and
// approved by the trustees before launch (see BRD "Compliance and policy
// dependencies"). Anything left null is hidden from the public site.

export const site = {
  name: "Nedivut Charitable Trust",
  shortName: "Nedivut",
  tagline: "Growing futures through education and care",
  description:
    "Nedivut Charitable Trust, Coimbatore, supports education, child welfare, elder care and community development across Tamil Nadu.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  city: "Coimbatore, Tamil Nadu, India",

  contact: {
    // TODO: replace with the trust's approved contact details.
    email: "hello@nedivut.org",
    phone: null as string | null,
    whatsapp: null as string | null, // digits only, with country code, e.g. "919800000000"
    address: "Coimbatore, Tamil Nadu, India",
    hours: "Monday to Saturday, 10:00 am to 6:00 pm IST",
  },

  social: [] as { label: string; href: string }[],

  // Shown on receipts and the About page only once officially available.
  legal: {
    legalName: "Nedivut Charitable Trust",
    registeredAddress: null as string | null,
    pan: null as string | null,
    registration: null as string | null,
    // Set only after CA approval of 80G wording; enables tax-deduction text.
    section80G: null as string | null,
  },
} as const;

export const nav = [
  { href: "/about", label: "About" },
  { href: "/programmes", label: "Programmes" },
  { href: "/impact", label: "Impact" },
  { href: "/stories", label: "Stories" },
  { href: "/request-support", label: "Request support" },
  { href: "/contact", label: "Contact" },
] as const;

export const donation = {
  presets: [500, 1000, 2500, 5000, 10000],
  min: 100,
  max: 500000,
} as const;

// Fallback when Supabase is not configured (the database is the source of truth).
export const defaultPurposes = [
  { slug: "general", label: "Where it is needed most" },
  { slug: "education", label: "Education support" },
  { slug: "child-welfare", label: "Child welfare" },
  { slug: "elder-care", label: "Elder care" },
  { slug: "community", label: "Community development" },
];

export const programmes = [
  {
    slug: "education",
    title: "Education support",
    summary:
      "Fee assistance, books and learning materials so that no capable student leaves school or college for want of money.",
    points: [
      "School and college fee assistance, paid directly to institutions",
      "Books, uniforms, stationery and digital learning access",
      "Guidance for students and families on scholarships and next steps",
    ],
  },
  {
    slug: "child-welfare",
    title: "Child welfare",
    summary:
      "Nutrition, health and safe spaces for children, delivered with strict safeguarding and guardian consent.",
    points: [
      "Nutrition and health check-up support",
      "Safe after-school learning spaces",
      "Child-safeguarding standards across every activity",
    ],
  },
  {
    slug: "elder-care",
    title: "Elder care",
    summary:
      "Dignity and companionship for elders who live alone or without steady support.",
    points: [
      "Essentials and medical support for elders in need",
      "Regular visits and companionship",
      "Help accessing government schemes and pensions",
    ],
  },
  {
    slug: "community",
    title: "Community development",
    summary:
      "Practical initiatives, shaped with local communities, that strengthen families and neighbourhoods.",
    points: [
      "Awareness camps and skill sessions",
      "Relief support during emergencies",
      "Partnerships with local institutions and volunteers",
    ],
  },
] as const;

export const enquiryCategories = [
  { value: "donation", label: "Donations and receipts" },
  { value: "support", label: "Education support request" },
  { value: "volunteer", label: "Volunteering" },
  { value: "partnership", label: "Institutions and partnerships" },
  { value: "media", label: "Media" },
  { value: "other", label: "Something else" },
] as const;

export const documentTypes = [
  { value: "fee_statement", label: "Fee statement or demand letter" },
  { value: "identity", label: "Student identity proof" },
  { value: "relationship", label: "Guardian relationship proof" },
  { value: "income", label: "Income certificate or supporting document" },
  { value: "marksheet", label: "Latest mark sheet" },
] as const;
