/** The Nedivut mark: a rising sun over two leaves growing from an open book. */
export function LogoMark({ className = "h-10 w-10", tile = true }: { className?: string; tile?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {tile && <rect width="64" height="64" rx="14" fill="#0f4643" />}
      <circle cx="32" cy="17" r="6.2" fill="#d69d58" />
      <path d="M31 41C28 32 22 27 13 23c1 9 7 15 18 18Z" fill="#f8f7f3" />
      <path d="M33 41c3-9 9-14 18-18-1 9-7 15-18 18Z" fill="#f8f7f3" />
      <path d="M15 37.5c7 0 12 1.6 16 4.5-5-1.4-10.5-2-16.6-1.6Z" fill="#f8f7f3" />
      <path d="M49 37.5c-7 0-12 1.6-16 4.5 5-1.4 10.5-2 16.6-1.6Z" fill="#f8f7f3" />
      <path d="M10.5 42.4c9.5-.4 16.4 1.6 21.5 5.2 5.1-3.6 12-5.6 21.5-5.2l1 3c-9.3-.4-16 1.4-22.5 5.6-6.5-4.2-13.2-6-22.5-5.6Z" fill="#f8f7f3" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <LogoMark />
      <span className="leading-tight">
        <span className={`block font-display text-xl font-semibold ${light ? "text-cream" : "text-teal-900"}`}>Nedivut</span>
        <span className={`block text-[0.65rem] tracking-[0.2em] uppercase ${light ? "text-cream/70" : "text-muted"}`}>
          Charitable Trust
        </span>
      </span>
    </span>
  );
}
