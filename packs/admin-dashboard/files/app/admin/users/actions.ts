'use server';

// Server actions for the admin users page.
// Extracted from page.tsx so that the Client Component can import them
// without triggering the Next.js "inline 'use server' in a Client Component"
// build error.

import { revalidatePath } from 'next/cache';

export async function toggleUserRole(userId: string, currentRole: string): Promise<void> {
  // TODO: wire to your db — flip user.role between 'user' and 'admin'
  // Example (Drizzle):
  //   const next = currentRole === 'admin' ? 'user' : 'admin';
  //   await db.update(users).set({ role: next }).where(eq(users.id, userId));
  void userId;
  void currentRole;
  revalidatePath('/admin/users');
}
