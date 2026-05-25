import 'server-only';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export type AdminUser = { id: string; email: string; name?: string | null; role: string };

type SessionUser = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  role?: string | null;
};

function configuredAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin(): Promise<AdminUser> {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user as SessionUser | undefined;
  const email = user?.email?.trim().toLowerCase();

  // TODO: ADM-001 delivers the role field on user records.
  const isAdmin =
    Boolean(user) &&
    (user?.role === 'admin' || Boolean(email && configuredAdminEmails().includes(email)));

  if (!isAdmin || !user) {
    // open-saas #492: server-side gating is normative; never render admin markup before this guard passes.
    redirect('/');
  }

  return {
    id: user.id ?? '',
    email: user.email ?? '',
    name: user.name ?? null,
    role: user.role ?? 'admin',
  };
}
