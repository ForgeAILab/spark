import type { ReactNode } from 'react';

// Placeholder authed-route layout.
//
// The `auth-better-auth` pack will replace this with a server-side guard that
// calls `getSessionUser()` and `redirect('/login')` when there is no session.
// Until then this just renders children so the scaffold compiles and runs.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>
  );
}
