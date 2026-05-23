import Link from 'next/link';
import { getSessionUser } from '@/lib/auth-placeholder';
import { PostsPanel } from './posts-panel';

export default async function AppHome() {
  const user = await getSessionUser();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Home
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {user ? `Hello ${user.name}` : 'Hello, friend'}
          </h1>
        </div>
        {!user && (
          <Link
            href="/login"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Sign in
          </Link>
        )}
      </header>

      {!user && (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No session detected. Install the{' '}
          <code className="rounded bg-amber-100 px-1">auth-better-auth</code>{' '}
          pack to wire real authentication.
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-700">Your posts</h2>
        <PostsPanel />
      </section>
    </main>
  );
}
