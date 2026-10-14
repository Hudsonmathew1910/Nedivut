import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { defaultPurposes } from "./site";
import { supabasePublic } from "./supabase";

export type Purpose = { slug: string; label: string };

/** Donation purposes are admin-configurable in the database (DON 02). */
export async function getPurposes(): Promise<Purpose[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("purposes");

  const db = supabasePublic();
  if (!db) return defaultPurposes;
  const { data, error } = await db.from("donation_purposes").select("slug,label").order("sort");
  if (error || !data?.length) return defaultPurposes;
  return data as Purpose[];
}
