import Link from 'next/link';
import { requireAdmin } from '@/lib/require-admin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // NORMATIVE: guard runs before any admin markup is produced.
  // Non-admins and unauthenticated requests are redirected here — they never
  // reach the JSX below. (ref: open-saas #492)
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r bg-muted/40">
        <div className="flex h-14 items-center border-b px-4">
          <span className="text-sm font-semibold tracking-tight">Admin</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-2 py-3">
          <Link
            href="/admin"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Overview
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Users
          </Link>
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-14 items-center justify-between border-b px-6">
          <span className="text-sm text-muted-foreground">Admin console</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{admin.email}</span>
            {/* wire me: replace with your auth provider's sign-out button/form */}
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              disabled
              title="Wire me: call your auth sign-out handler here"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto py-6">
          <div className="mx-auto w-full max-w-7xl px-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
