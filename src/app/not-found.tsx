import Link from "next/link";
import { LogoMark } from "@/components/logo";

export default function NotFound() {
  return (
    <section className="container-page flex flex-col items-center py-24 text-center">
      <LogoMark className="h-16 w-16" />
      <h1 className="mt-6 font-display text-4xl text-teal-900">Page not found</h1>
      <p className="mt-3 text-muted">The page you are looking for has moved or does not exist.</p>
      <Link href="/" className="btn-teal mt-8">
        Back to home
      </Link>
    </section>
  );
}
