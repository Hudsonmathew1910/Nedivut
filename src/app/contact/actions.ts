"use server";

import { z } from "zod";
import type { FormState } from "@/components/form";
import { emailLayout, notifyTeam, sendEmail } from "@/lib/email";
import { genericFailure, rateLimited, validationFailure } from "@/lib/forms";
import { allowRequest, isBot } from "@/lib/security";
import { enquiryCategories, site } from "@/lib/site";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

const schema = z
  .object({
    name: z.string().trim().min(2, "Please enter your name.").max(120),
    email: z.union([z.literal(""), z.email("Please enter a valid email address.")]),
    phone: z.union([z.literal(""), z.string().trim().regex(/^[+\d][\d\s-]{7,16}$/, "Please enter a valid phone number.")]),
    category: z.enum(enquiryCategories.map((c) => c.value) as [string, ...string[]], { error: "Please choose a topic." }),
    message: z.string().trim().min(10, "Please write a little more (at least 10 characters).").max(4000),
    consent: z.literal("on", { error: "Please agree so that we can respond to you." }),
  })
  .refine((d) => d.email || d.phone, { path: ["email"], message: "Please give an email address or phone number." });

export async function submitEnquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { ok: true };

  const parsed = schema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    category: formData.get("category") ?? "",
    message: formData.get("message") ?? "",
    consent: formData.get("consent") ?? "",
  });
  if (!parsed.success) return validationFailure(parsed.error, formData);
  if (!isSupabaseConfigured) return genericFailure(formData);
  if (!(await allowRequest("contact", 5, 600))) return rateLimited(formData);

  const d = parsed.data;
  const { error } = await supabaseAdmin().from("enquiries").insert({
    name: d.name,
    email: d.email || null,
    phone: d.phone || null,
    category: d.category,
    message: d.message,
    consent: true,
  });
  if (error) {
    console.error("enquiry insert failed", error.message);
    return genericFailure(formData);
  }

  const topic = enquiryCategories.find((c) => c.value === d.category)?.label ?? d.category;
  await Promise.all([
    d.email &&
      sendEmail(
        d.email,
        `We received your message – ${site.name}`,
        emailLayout("Thank you for getting in touch", [
          `Dear ${d.name},`,
          `We have received your message about "${topic}". A member of our team will respond as soon as possible.`,
        ]),
      ),
    notifyTeam(`New enquiry: ${topic}`, [`From: ${d.name}`, `Email: ${d.email || "-"}`, `Phone: ${d.phone || "-"}`, d.message]),
  ]);

  return { ok: true, message: "Thank you. Your message has reached our team and we will be in touch soon." };
}
