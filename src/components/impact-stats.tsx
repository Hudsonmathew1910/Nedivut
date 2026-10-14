import { formatAsOf, formatMetric, getImpactMetrics } from "@/lib/impact";

const pending = [
  { label: "Children supported", definition: "Unique children who received support from the trust." },
  { label: "Education requests supported", definition: "Education-support requests approved and paid out." },
  { label: "Active donors", definition: "Donors with a successful donation in the last 12 months." },
  { label: "Funds deployed", definition: "Amount disbursed to programmes, from reconciled records." },
];

/** Verified impact numbers. Shows definitions without values until metrics are approved. */
export async function ImpactStats({ dark = false, detailed = false }: { dark?: boolean; detailed?: boolean }) {
  const metrics = await getImpactMetrics();
  const tone = dark ? "text-cream" : "text-teal-900";
  const sub = dark ? "text-cream/70" : "text-muted";

  if (metrics.length === 0) {
    return (
      <div>
        <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pending.map((m) => (
            <div key={m.label} className={dark ? "rounded-2xl bg-white/5 p-6 ring-1 ring-white/10" : "card"}>
              <dt className={`text-sm font-medium ${sub}`}>{m.label}</dt>
              <dd className={`mt-2 font-display text-2xl ${tone}`}>Being verified</dd>
              {detailed && <dd className={`mt-3 text-sm leading-relaxed ${sub}`}>{m.definition}</dd>}
            </div>
          ))}
        </dl>
        <p className={`mt-6 text-sm ${sub}`}>
          We publish only numbers that have been checked against our records and approved by the trustees. Figures will
          appear here, each with its definition and as-of date, once verified.
        </p>
      </div>
    );
  }

  return (
    <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((m) => (
        <div key={m.key} className={dark ? "rounded-2xl bg-white/5 p-6 ring-1 ring-white/10" : "card"}>
          <dt className={`text-sm font-medium ${sub}`}>{m.label}</dt>
          <dd className={`mt-2 font-display text-4xl ${dark ? "text-gold-300" : "text-teal-900"}`}>{formatMetric(m)}</dd>
          <dd className={`mt-2 text-xs ${sub}`}>As of {formatAsOf(m.as_of)}</dd>
          {detailed && <dd className={`mt-3 text-sm leading-relaxed ${sub}`}>{m.definition}</dd>}
        </div>
      ))}
    </dl>
  );
}
