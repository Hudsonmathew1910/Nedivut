"use client";

import { useActionState } from "react";
import { Checkbox, Field, FormAlert, Honeypot, fieldProps, type FormState } from "@/components/form";
import { enquiryCategories } from "@/lib/site";
import { submitEnquiry } from "./actions";

export function ContactForm() {
  const [state, action, pending] = useActionState(submitEnquiry, {} as FormState);

  if (state.ok) {
    return (
      <div role="status" className="card text-center">
        <h2 className="font-display text-2xl text-teal-900">Message sent</h2>
        <p className="mt-3 text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="card relative space-y-5" noValidate>
      <Honeypot />
      <FormAlert state={state} />
      <Field name="name" label="Your name" state={state} required>
        <input {...fieldProps("name", state)} className="field-input" autoComplete="name" required />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="email" label="Email" state={state}>
          <input {...fieldProps("email", state)} type="email" className="field-input" autoComplete="email" />
        </Field>
        <Field name="phone" label="Phone" state={state}>
          <input {...fieldProps("phone", state)} type="tel" className="field-input" autoComplete="tel" />
        </Field>
      </div>
      <Field name="category" label="What is this about?" state={state} required>
        <select {...fieldProps("category", state)} className="field-input" required defaultValue={state.values?.category ?? ""}>
          <option value="" disabled>
            Choose a topic
          </option>
          {enquiryCategories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>
      <Field name="message" label="Message" state={state} required>
        <textarea {...fieldProps("message", state)} rows={5} className="field-input" required />
      </Field>
      <Checkbox name="consent" state={state} required>
        I agree that Nedivut may use these details to respond to my enquiry, as described in the privacy notice.
      </Checkbox>
      <button type="submit" className="btn-teal w-full sm:w-auto" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
