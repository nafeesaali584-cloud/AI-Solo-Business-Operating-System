import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main
      role="main"
      className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--text-primary)] px-4 py-12"
    >
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-6 shadow-lg text-[var(--accent)]">
          <Compass className="w-8 h-8" />
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
          404 Error
        </p>

        <h1 className="font-heading text-3xl font-bold tracking-tight mb-3">
          Page Not Found
        </h1>

        <p className="text-sm text-[var(--text-muted)] mb-8 max-w-sm mx-auto">
          The page or resource you requested does not exist or has been moved.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent)] hover:opacity-90 text-white text-sm font-medium transition-all shadow-md shadow-[var(--accent)]/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </main>
  );
}
