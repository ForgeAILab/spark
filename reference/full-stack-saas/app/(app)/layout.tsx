import Link from 'next/link';
import type { ReactNode } from 'react';
import { ZeroProvider } from '@/components/zero-provider';
import { getSession } from '@/lib/auth-helpers';

export default async function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await getSession();
  const authData = session
    ? {
        sub: session.user.id,
        name: session.user.name ?? undefined,
        email: session.user.email ?? undefined,
      }
    : undefined;

  return (
    <ZeroProvider authData={authData}>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="border-b border-border bg-background/60 backdrop-blur">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4">
            <Link className="text-sm font-semibold tracking-tight" href="/home">
              Anvil reference
            </Link>
            <div className="text-xs text-muted-foreground" data-testid="user-menu-placeholder">
              {session?.user.email ?? 'Guest'}
            </div>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </ZeroProvider>
  );
}
