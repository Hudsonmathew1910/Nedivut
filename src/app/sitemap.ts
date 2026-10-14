import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

const paths = [
  "",
  "/about",
  "/programmes",
  "/impact",
  "/stories",
  "/donate",
  "/request-support",
  "/contact",
  "/faqs",
  "/policies/privacy",
  "/policies/terms",
  "/policies/donation-refund",
  "/policies/safeguarding",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((p) => ({ url: `${site.url}${p}` }));
}
