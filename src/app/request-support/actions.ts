"use server";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { FormState } from "@/components/form";
import { emailLayout, notifyTeam, sendEmail } from "@/lib/email";
import { genericFailure, rateLimited, validationFailure } from "@/lib/forms";
import { allowRequest, isBot, sniffFileType } from "@/lib/security";
import { documentTypes, site } from "@/lib/site";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

const BUCKET = "support-documents";
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"] as const;
const EXT: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };
const docTypeValues = documentTypes.map((d) => d.value) as [string, ...string[]];

const optional = (max: number) => z.string().trim().max(max).optional().default("");

const schema = z
  .object({
    submitter_role: z.enum(["student", "parent", "guardian", "referrer"], { error: "Please tell us who is submitting." }),
    referrer_organisation: optional(160),
    student_name: z.string().trim().min(2, "Please enter the student's full name.").max(120),
    student_dob: z.iso.date("Please enter the student's date of birth."),
    guardian_name: optional(120),
    guardian_relationship: optional(60),
    guardian_consent: z.string().optional(),
    email: z.email("Please enter a valid email address."),
    phone: z.string().trim().regex(/^[+\d][\d\s-]{7,16}$/, "Please enter a valid phone number."),
    address: z.string().trim().min(10, "Please enter the full address.").max(500),
    institution_name: z.string().trim().min(2, "Please enter the school or college name.").max(200),
    institution_city: z.string().trim().min(2, "Please enter the city or town.").max(100),
    course: z.string().trim().min(2, "Please enter the class or course.").max(160),
    academic_year: z.string().trim().min(4, "Please enter the academic year, e.g. 2026-27.").max(20),
    requested_amount: z.coerce
      .number({ error: "Please enter an amount in rupees." })
      .min(500, "The minimum request is ₹500.")
      .max(500000, "For requests above ₹5,00,000 please contact us directly."),
    purpose: z.string().trim().min(10, "Please describe what the support is for.").max(1000),
    household_context: z.string().trim().min(20, "Please tell us a little about the family's situation (at least 20 characters).").max(3000),
    declaration: z.literal("on", { error: "Please confirm the declaration." }),
    privacy_consent: z.literal("on", { error: "Please agree to the privacy notice." }),
    documents: z
      .array(
        z.object({
          type: z.enum(docTypeValues),
          size: z.number().int().positive().max(MAX_FILE_BYTES, "Each document must be 2 MB or smaller."),
          mime: z.enum(ALLOWED_MIME, { error: "Documents must be PDF, JPG or PNG files." }),
        }),
      )
      .max(documentTypes.length),
  })
  .superRefine((d, ctx) => {
    const minor = ageInYears(d.student_dob) < 18;
    const needsGuardian = minor || d.submitter_role === "parent" || d.submitter_role === "guardian";
    if (needsGuardian && d.guardian_name.length < 2)
      ctx.addIssue({ code: "custom", path: ["guardian_name"], message: "Please enter the parent or guardian's name." });
    if (needsGuardian && d.guardian_relationship.length < 2)
      ctx.addIssue({ code: "custom", path: ["guardian_relationship"], message: "Please enter their relationship to the student." });
    if (minor && d.guardian_consent !== "on")
      ctx.addIssue({ code: "custom", path: ["guardian_consent"], message: "A parent or guardian must consent for students under 18." });
    if (d.submitter_role === "referrer" && d.referrer_organisation.length < 2)
      ctx.addIssue({ code: "custom", path: ["referrer_organisation"], message: "Please enter your school or organisation." });
    const age = ageInYears(d.student_dob);
    if (age < 3 || age > 40) ctx.addIssue({ code: "custom", path: ["student_dob"], message: "Please check the date of birth." });

    const types = d.documents.map((x) => x.type);
    if (new Set(types).size !== types.length)
      ctx.addIssue({ code: "custom", path: ["documents"], message: "Please upload one file per document type." });
    for (const req of ["fee_statement", "identity"])
      if (!types.includes(req))
        ctx.addIssue({ code: "custom", path: [`doc_${req}`], message: "This document is required." });
    d.documents.forEach((doc) => {
      if (doc.size > MAX_FILE_BYTES)
        ctx.addIssue({ code: "custom", path: [`doc_${doc.type}`], message: "This file is larger than 2 MB." });
    });
  });

function ageInYears(isoDate: string) {
  const dob = new Date(`${isoDate}T00:00:00Z`);
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const m = now.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < dob.getUTCDate())) age--;
  return age;
}

function signingKey() {
  return process.env.FORM_SIGNING_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

function sign(requestId: string) {
  return createHmac("sha256", signingKey()).update(`support:${requestId}`).digest("hex");
}

/** Non-guessable, human-friendly reference, e.g. NED-7K3P-QX9M-2F. */
function makeReference() {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = randomBytes(10);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `NED-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 10)}`;
}

export type StartResult = FormState & {
  requestId?: string;
  token?: string;
  uploads?: { type: string; path: string; token: string }[];
};

/** Step 1: validate and create the request, returning one-time upload URLs for its documents. */
export async function startSupportRequest(formData: FormData): Promise<StartResult> {
  if (isBot(formData)) return { ok: true, reference: "received" };

  let documents: unknown = [];
  try {
    documents = JSON.parse(String(formData.get("documents") ?? "[]"));
  } catch {
    documents = [];
  }

  const raw = Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string"));
  const parsed = schema.safeParse({ ...raw, documents });
  if (!parsed.success) return validationFailure(parsed.error, formData);
  if (!isSupabaseConfigured) return genericFailure(formData);
  if (!(await allowRequest("support", 3, 3600))) return rateLimited(formData);

  const d = parsed.data;
  const db = supabaseAdmin();
  const reference = makeReference();
  const { data: row, error } = await db
    .from("support_requests")
    .insert({
      reference,
      submitter_role: d.submitter_role,
      referrer_organisation: d.referrer_organisation || null,
      student_name: d.student_name,
      student_dob: d.student_dob,
      is_minor: ageInYears(d.student_dob) < 18,
      guardian_name: d.guardian_name || null,
      guardian_relationship: d.guardian_relationship || null,
      guardian_consent: d.guardian_consent === "on",
      email: d.email,
      phone: d.phone,
      address: d.address,
      institution_name: d.institution_name,
      institution_city: d.institution_city,
      course: d.course,
      academic_year: d.academic_year,
      requested_amount: d.requested_amount,
      purpose: d.purpose,
      household_context: d.household_context,
      declaration: true,
      privacy_consent: true,
    })
    .select("id")
    .single();
  if (error || !row) {
    console.error("support request insert failed", error?.message);
    return genericFailure(formData);
  }

  const uploads: StartResult["uploads"] = [];
  for (const doc of d.documents) {
    const path = `${row.id}/${doc.type}.${EXT[doc.mime]}`;
    const { data: signed, error: signError } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
    if (signError || !signed) {
      console.error("signed upload url failed", signError?.message);
      continue;
    }
    uploads.push({ type: doc.type, path: signed.path, token: signed.token });
  }

  return { ok: true, reference, requestId: row.id, token: sign(row.id), uploads };
}

/**
 * Step 2: after the browser has uploaded, verify each file's real content,
 * record the valid ones, and acknowledge the request exactly once.
 */
export async function finalizeSupportRequest(requestId: string, token: string): Promise<{ ok: boolean; missing: string[] }> {
  const expected = Buffer.from(sign(requestId), "hex");
  const given = Buffer.from(token, "hex");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return { ok: false, missing: [] };

  const db = supabaseAdmin();
  const { data: request } = await db
    .from("support_requests")
    .select("id,reference,student_name,email,guardian_name,submitter_role,acknowledged_at")
    .eq("id", requestId)
    .single();
  if (!request) return { ok: false, missing: [] };
  if (request.acknowledged_at) return { ok: true, missing: [] };

  const { data: files } = await db.storage.from(BUCKET).list(requestId);
  const recorded: string[] = [];
  for (const f of files ?? []) {
    const path = `${requestId}/${f.name}`;
    const type = f.name.split(".")[0];
    const { data: blob } = await db.storage.from(BUCKET).download(path);
    const mime = blob ? await sniffFileType(new File([blob], f.name)) : null;
    if (!blob || !mime || !docTypeValues.includes(type) || blob.size > MAX_FILE_BYTES) {
      await db.storage.from(BUCKET).remove([path]);
      continue;
    }
    await db.from("support_documents").insert({
      request_id: requestId,
      doc_type: type,
      storage_path: path,
      file_name: f.name,
      size_bytes: blob.size,
      mime_type: mime,
    });
    recorded.push(type);
  }

  const missing = ["fee_statement", "identity"].filter((t) => !recorded.includes(t));
  const { data: claimed } = await db
    .from("support_requests")
    .update({ acknowledged_at: new Date().toISOString(), ...(missing.length ? { status: "documents_pending" } : {}) })
    .eq("id", requestId)
    .is("acknowledged_at", null)
    .select("id");

  if (claimed?.length) {
    const greeting = request.guardian_name && request.submitter_role !== "student" ? request.guardian_name : request.student_name;
    await Promise.all([
      sendEmail(
        request.email,
        `Request received – ${request.reference}`,
        emailLayout("We have received your request", [
          `Dear ${greeting},`,
          `Thank you for your education-support request. Your reference number is ${request.reference}. Please quote it whenever you contact us.`,
          "Our team will review the request and contact you if we need anything more. Please note that submitting a request does not guarantee assistance.",
          `If you did not make this request, please write to ${site.contact.email}.`,
        ]),
      ),
      notifyTeam(`New education-support request ${request.reference}`, [
        `Reference: ${request.reference}`,
        `Documents received: ${recorded.length ? recorded.join(", ") : "none"}`,
        "Review it in the Supabase dashboard (support_requests).",
      ]),
    ]);
  }

  return { ok: true, missing };
}
