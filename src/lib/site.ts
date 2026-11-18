// Central site configuration. Values marked TODO must be confirmed and
// approved by the trustees before launch (see BRD "Compliance and policy
// dependencies"). Anything left null is hidden from the public site.

export const site = {
  name: "Nedivut Charitable Trust",
  shortName: "Nedivut",
  tagline: "Growing futures through education and care",
  description:
    "Nedivut Charitable Trust is an India-based charitable trust supporting children's education, child welfare, student mentorship and community engagement.",
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
// Slugs must match the programme slugs below so every "Donate to" button
// preselects the matching donation option.
export const defaultPurposes = [
  { slug: "general", label: "Where it is needed most" },
  { slug: "education", label: "Education Support" },
  { slug: "child-welfare", label: "Child Welfare & Care" },
  { slug: "mentorship", label: "Student Mentorship & Development" },
  { slug: "community", label: "Community Development & Engagement" },
];

export const programmes = [
  {
    slug: "education",
    title: "Education Support",
    summary:
      "Financial assistance and access to learning resources, so that children can continue their studies and no capable student leaves school or college for want of money.",
    points: [
      "School and college fee assistance, paid directly to institutions",
      "Books, uniforms and stationery",
      "Digital learning resources",
      "Guidance for students on scholarships and further education",
    ],
  },
  {
    slug: "child-welfare",
    title: "Child Welfare & Care",
    summary:
      "Supporting children's well-being, so that they are healthy, safe and ready to learn and grow.",
    // TODO: activities awaiting trustee confirmation (nutrition support, health
    // check-up support, safe after-school learning spaces). Do not list them
    // here as available services until they are confirmed.
    points: [
      "Care for children's well-being alongside their education",
      "Child-safeguarding standards across every activity",
      "Guardian consent for every child we work with",
    ],
  },
  {
    slug: "mentorship",
    title: "Student Mentorship & Development",
    summary:
      "Helping students build confidence, develop practical skills and make informed choices about their future.",
    points: [
      "Career awareness, further education guidance and mentorship from volunteers and working professionals",
      "Communication, confidence building and life skills",
      "Basic computer skills and responsible use of technology",
    ],
  },
  {
    slug: "community",
    title: "Community Development & Engagement",
    summary:
      "Working with schools, volunteers and local communities to create better learning opportunities for children.",
    points: [
      "Educational drives to collect books, stationery and learning materials",
      "Community awareness programmes on education and child well-being",
      "Volunteer-led learning activities and collaboration with schools, colleges and local organisations",
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
