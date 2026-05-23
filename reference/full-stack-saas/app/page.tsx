import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getSession } from '@/lib/auth-helpers';

export default async function Home() {
  const session = await getSession();

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(217_89%_48%_/_0.18),_transparent_55%),radial-gradient(circle_at_bottom_right,_hsl(174_84%_37%_/_0.18),_transparent_60%)]"
      />
      <section className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 px-6 py-12 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Forge AI Lab reference
        </p>
        <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">
          Spark reference app
        </h1>
        <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          The spark reference app — proves the hybrid pack stack composes.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href={session ? '/home' : '/login'}>
              {session ? 'Open app' : 'Sign in'}
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
