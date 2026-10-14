import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { supabasePublic } from "./supabase";

export type Metric = {
  key: string;
  label: string;
  value: number;
  unit: string | null;
  definition: string;
  as_of: string;
};

/** Approved public metrics only (RLS hides drafts). Empty until trustees approve values. */
export async function getImpactMetrics(): Promise<Metric[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("impact");

  const db = supabasePublic();
  if (!db) return [];
  const { data, error } = await db
    .from("impact_metrics")
    .select("key,label,value,unit,definition,as_of")
    .order("sort");
  if (error) {
    console.error("impact metrics read failed", error.message);
    return [];
  }
  return (data ?? []) as Metric[];
}

export function formatMetric(m: Metric) {
  if (m.unit === "INR") {
    if (m.value >= 10000000) return `₹${(m.value / 10000000).toFixed(1).replace(/\.0$/, "")} Cr`;
    if (m.value >= 100000) return `₹${(m.value / 100000).toFixed(1).replace(/\.0$/, "")} L`;
    return `₹${m.value.toLocaleString("en-IN")}`;
  }
  return m.value.toLocaleString("en-IN");
}

export function formatAsOf(date: string) {
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
}
