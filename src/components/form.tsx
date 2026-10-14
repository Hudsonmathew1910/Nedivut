import type { ReactNode } from "react";

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
  /** Submitted text values, echoed back so fields keep their input after a validation error. */
  values?: Record<string, string>;
  reference?: string;
};

export function Field({
  name,
  label,
  state,
  hint,
  required,
  children,
}: {
  name: string;
  label: string;
  state: FormState;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const error = state.errors?.[name]?.[0];
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
        {required && <span className="text-red-700" aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${name}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

/** Props that wire an input to its label, hint and error message. */
export function fieldProps(name: string, state: FormState, hint?: boolean) {
  const invalid = Boolean(state.errors?.[name]?.length);
  return {
    id: name,
    name,
    "aria-invalid": invalid || undefined,
    "aria-describedby": invalid ? `${name}-error` : hint ? `${name}-hint` : undefined,
    defaultValue: state.values?.[name],
  };
}

export function Honeypot() {
  return (
    <div className="absolute -left-[9999px]" aria-hidden="true">
      <label htmlFor="website">Leave this empty</label>
      <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

export function FormAlert({ state }: { state: FormState }) {
  if (!state.message || state.ok) return null;
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {state.message}
    </div>
  );
}

export function Checkbox({ name, state, children, required }: { name: string; state: FormState; children: ReactNode; required?: boolean }) {
  const error = state.errors?.[name]?.[0];
  return (
    <div>
      <label className="flex gap-3 text-sm leading-relaxed text-ink/85">
        <input
          type="checkbox"
          name={name}
          required={required}
          defaultChecked={state.values?.[name] === "on"}
          aria-invalid={Boolean(error) || undefined}
          className="mt-0.5 h-5 w-5 flex-none rounded border-teal-900/30 accent-teal-800"
        />
        <span>{children}</span>
      </label>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
