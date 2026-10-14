import type { z } from "zod";
import type { FormState } from "@/components/form";

/** Text-only snapshot of submitted fields (files and internal keys are dropped). */
export function echoValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("$ACTION") && k !== "website") values[k] = v;
  }
  return values;
}

export function validationFailure(error: z.ZodError, formData: FormData): FormState {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return {
    ok: false,
    message: "Please check the highlighted fields and try again.",
    errors: fieldErrors,
    values: echoValues(formData),
  };
}

export const genericFailure = (formData: FormData): FormState => ({
  ok: false,
  message: "Sorry, something went wrong on our side. Please try again in a few minutes.",
  values: echoValues(formData),
});

export const rateLimited = (formData: FormData): FormState => ({
  ok: false,
  message: "Too many submissions from your connection. Please wait a little and try again.",
  values: echoValues(formData),
});
