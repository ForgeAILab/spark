'use server';

import { headers as nextHeaders } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export async function signOutAction(): Promise<void> {
  await auth.api.signOut({
    headers: (await nextHeaders()) as unknown as Headers,
  });
  redirect('/login');
}
