import type { Provider } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function signInWithOAuth(formData: FormData) {
  'use server';

  const rawProvider = formData.get('provider');
  if (rawProvider !== 'github' && rawProvider !== 'google') {
    redirect('/login?error=unsupported-provider');
  }

  const provider: Provider = rawProvider;
  const requestHeaders = await headers();
  const origin = requestHeaders.get('origin') ?? 'http://localhost:3000';
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }

  redirect('/login?error=missing-redirect-url');
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">Choose an OAuth provider to continue.</p>
      </div>

      <form action={signInWithOAuth} className="mt-8 grid gap-3">
        <button
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          name="provider"
          type="submit"
          value="github"
        >
          Continue with GitHub
        </button>
        <button
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          name="provider"
          type="submit"
          value="google"
        >
          Continue with Google
        </button>
      </form>
    </main>
  );
}
