import Link from 'next/link';

export default function PublicLanding() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-6 py-16">
      <section className="w-full max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Spark
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          {'{{appName}}'}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          A board-driven Next.js scaffold. Plan the work in{' '}
          <code className="rounded bg-slate-200/70 px-1.5 py-0.5 text-sm text-slate-800">
            .ai/board.md
          </code>{' '}
          and add capabilities with packs.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            Sign in
          </Link>
          <a
            href="https://nextjs.org/docs/app"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Docs
          </a>
        </div>
      </section>
    </main>
  );
}
