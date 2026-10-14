import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { isSupabaseConfigured, supabaseAdmin } from "./supabase";

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Returns true when the request is within limits. Keys are hashed so raw IPs
 * are never stored. Fails open if the database call errors, so a Supabase
 * hiccup never blocks a genuine donor.
 */
export async function allowRequest(form: string, max: number, windowSeconds: number): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  const salt = process.env.RATE_LIMIT_SALT ?? "nedivut";
  const key = createHash("sha256").update(`${salt}:${form}:${await clientIp()}`).digest("hex");
  const { data, error } = await supabaseAdmin().rpc("hit_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("rate limit check failed", error.message);
    return true;
  }
  return data === true;
}

/** Honeypot: real users never see or fill the "website" field. */
export function isBot(formData: FormData): boolean {
  return Boolean(formData.get("website"));
}

const signatures: Record<string, number[][]> = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]],
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
};

/**
 * Checks the file's real content matches an allowed type (not just its
 * extension or claimed MIME type). Returns the detected MIME type or null.
 */
export async function sniffFileType(file: File): Promise<string | null> {
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  for (const [mime, sigs] of Object.entries(signatures)) {
    if (sigs.some((sig) => sig.every((b, i) => head[i] === b))) return mime;
  }
  return null;
}
