"use client";

import { createClient } from "@supabase/supabase-js";
import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { Checkbox, Field, FormAlert, Honeypot, fieldProps, type FormState } from "@/components/form";
import { documentTypes } from "@/lib/site";
import { finalizeSupportRequest, startSupportRequest } from "./actions";

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const required = new Set(["fee_statement", "identity"]);

type Done = { reference: string; missing: string[]; uploadFailed: boolean };

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-5 border-t border-teal-900/10 pt-8 first:border-0 first:pt-0">
      <legend className="mb-1 font-display text-xl text-teal-900">{legend}</legend>
      {children}
    </fieldset>
  );
}

export function SupportForm() {
  const [state, setState] = useState<FormState>({});
  const [role, setRole] = useState("");
  const [done, setDone] = useState<Done | null>(null);
  const [step, setStep] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // Files go straight to private storage; only their metadata is sent with the form.
    const files: { type: string; file: File }[] = [];
    const errors: Record<string, string[]> = {};
    for (const d of documentTypes) {
      const f = data.get(`doc_${d.value}`);
      data.delete(`doc_${d.value}`);
      if (!(f instanceof File) || f.size === 0) continue;
      if (f.size > MAX_FILE_BYTES) errors[`doc_${d.value}`] = ["This file is larger than 2 MB. Please upload a smaller scan or photo."];
      else if (!["application/pdf", "image/jpeg", "image/png"].includes(f.type)) errors[`doc_${d.value}`] = ["Please upload a PDF, JPG or PNG file."];
      else files.push({ type: d.value, file: f });
    }
    if (Object.keys(errors).length) {
      setState({ ok: false, message: "Please check the highlighted documents.", errors, values: state.values });
      return;
    }
    data.set("documents", JSON.stringify(files.map((f) => ({ type: f.type, size: f.file.size, mime: f.file.type }))));

    startTransition(async () => {
      setStep("Submitting your request…");
      const res = await startSupportRequest(data);
      if (!res.ok || !res.reference) {
        setState(res);
        setStep("");
        form.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
        return;
      }
      if (!res.requestId || !res.token) {
        setDone({ reference: res.reference, missing: [], uploadFailed: false });
        return;
      }

      let uploadFailed = false;
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (url && anon && res.uploads?.length) {
        const storage = createClient(url, anon, { auth: { persistSession: false } }).storage.from("support-documents");
        for (const [i, u] of res.uploads.entries()) {
          setStep(`Uploading document ${i + 1} of ${res.uploads.length}…`);
          const file = files.find((f) => f.type === u.type)?.file;
          if (!file) continue;
          const { error } = await storage.uploadToSignedUrl(u.path, u.token, file, { contentType: file.type });
          if (error) uploadFailed = true;
        }
      }

      setStep("Checking documents…");
      const fin = await finalizeSupportRequest(res.requestId, res.token);
      setDone({ reference: res.reference, missing: fin.missing, uploadFailed });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (done) {
    const labels = done.missing.map((m) => documentTypes.find((d) => d.value === m)?.label ?? m);
    return (
      <div role="status" className="card">
        <p className="eyebrow">Request received</p>
        <h2 className="mt-2 font-display text-3xl text-teal-900">Thank you</h2>
        <p className="mt-4 text-muted">Your reference number is</p>
        <p className="mt-1 font-mono text-2xl font-semibold tracking-wider text-teal-900">{done.reference}</p>
        <p className="mt-4 leading-relaxed text-muted">
          Please keep this number safe and quote it when you contact us. We have sent an acknowledgement to your email.
          Our team will review your request and get in touch if we need anything more.
        </p>
        {(labels.length > 0 || done.uploadFailed) && (
          <div className="mt-5 rounded-xl bg-gold-100 p-4 text-sm leading-relaxed text-ink/85">
            Some documents did not reach us{labels.length ? `: ${labels.join(", ")}` : ""}. Our team will contact you to
            collect them. Please do not submit a second request.
          </div>
        )}
        <Link href="/" className="btn-teal mt-8">
          Back to home
        </Link>
      </div>
    );
  }

  const needsGuardian = role !== "student" && role !== "";

  return (
    <form onSubmit={onSubmit} className="card relative space-y-8" noValidate>
      <Honeypot />
      <FormAlert state={state} />

      <Fieldset legend="About you">
        <Field name="submitter_role" label="I am the" state={state} required>
          <select {...fieldProps("submitter_role", state)} className="field-input" required defaultValue={state.values?.submitter_role ?? ""} onChange={(e) => setRole(e.target.value)}>
            <option value="" disabled>
              Choose one
            </option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
            <option value="guardian">Legal guardian</option>
            <option value="referrer">Teacher or referring organisation</option>
          </select>
        </Field>
        {role === "referrer" && (
          <Field name="referrer_organisation" label="School or organisation" state={state} required>
            <input {...fieldProps("referrer_organisation", state)} className="field-input" />
          </Field>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="email" label="Email for updates" state={state} required>
            <input {...fieldProps("email", state)} type="email" className="field-input" autoComplete="email" required />
          </Field>
          <Field name="phone" label="Mobile number" state={state} required>
            <input {...fieldProps("phone", state)} type="tel" className="field-input" autoComplete="tel" required />
          </Field>
        </div>
        <Field name="address" label="Home address" state={state} required>
          <textarea {...fieldProps("address", state)} rows={2} className="field-input" autoComplete="street-address" required />
        </Field>
      </Fieldset>

      <Fieldset legend="Student">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="student_name" label="Student's full name" state={state} required>
            <input {...fieldProps("student_name", state)} className="field-input" required />
          </Field>
          <Field name="student_dob" label="Date of birth" state={state} required>
            <input {...fieldProps("student_dob", state)} type="date" className="field-input" required />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="guardian_name" label="Parent or guardian's name" state={state} required={needsGuardian} hint="Required if the student is under 18.">
            <input {...fieldProps("guardian_name", state, true)} className="field-input" />
          </Field>
          <Field name="guardian_relationship" label="Relationship to student" state={state} required={needsGuardian}>
            <input {...fieldProps("guardian_relationship", state)} className="field-input" placeholder="e.g. Mother, Uncle" />
          </Field>
        </div>
        <Checkbox name="guardian_consent" state={state}>
          For students under 18: I am the parent or legal guardian (or have their permission), and I consent to Nedivut
          processing the student&apos;s information to review this request.
        </Checkbox>
      </Fieldset>

      <Fieldset legend="Education">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="institution_name" label="School or college" state={state} required>
            <input {...fieldProps("institution_name", state)} className="field-input" required />
          </Field>
          <Field name="institution_city" label="City or town" state={state} required>
            <input {...fieldProps("institution_city", state)} className="field-input" required />
          </Field>
          <Field name="course" label="Class or course" state={state} required>
            <input {...fieldProps("course", state)} className="field-input" placeholder="e.g. Class 11, B.Sc. Physics" required />
          </Field>
          <Field name="academic_year" label="Academic year" state={state} required>
            <input {...fieldProps("academic_year", state)} className="field-input" placeholder="e.g. 2026-27" required />
          </Field>
        </div>
      </Fieldset>

      <Fieldset legend="Support needed">
        <Field name="requested_amount" label="Amount requested (₹)" state={state} required>
          <input {...fieldProps("requested_amount", state)} type="number" inputMode="numeric" min={500} step={1} className="field-input sm:max-w-xs" required />
        </Field>
        <Field name="purpose" label="What is it for?" state={state} required hint="For example: second-term tuition fee, hostel fee, books.">
          <textarea {...fieldProps("purpose", state, true)} rows={3} className="field-input" required />
        </Field>
        <Field name="household_context" label="Family situation" state={state} required hint="Tell us briefly about the household, income and why support is needed. This stays confidential.">
          <textarea {...fieldProps("household_context", state, true)} rows={5} className="field-input" required />
        </Field>
      </Fieldset>

      <Fieldset legend="Documents">
        <p className="text-sm text-muted">PDF, JPG or PNG, up to 2 MB each. Clear phone photos are fine.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          {documentTypes.map((d) => (
            <Field key={d.value} name={`doc_${d.value}`} label={d.label} state={state} required={required.has(d.value)}>
              <input
                id={`doc_${d.value}`}
                name={`doc_${d.value}`}
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                aria-invalid={Boolean(state.errors?.[`doc_${d.value}`]) || undefined}
                className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:font-semibold file:text-teal-900 hover:file:bg-teal-100"
              />
            </Field>
          ))}
        </div>
      </Fieldset>

      <Fieldset legend="Declaration">
        <Checkbox name="declaration" state={state} required>
          I declare that the information and documents I have provided are true to the best of my knowledge. I understand that
          submitting this request does not guarantee assistance.
        </Checkbox>
        <Checkbox name="privacy_consent" state={state} required>
          I have read the{" "}
          <Link href="/policies/privacy" className="font-semibold text-teal-700 underline" target="_blank">
            privacy notice
          </Link>{" "}
          and agree to Nedivut processing this information to review the request.
        </Checkbox>
      </Fieldset>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" className="btn-teal" disabled={pending}>
          {pending ? "Please wait…" : "Submit request"}
        </button>
        <p className="text-sm text-muted" aria-live="polite">
          {pending ? step : ""}
        </p>
      </div>
    </form>
  );
}
