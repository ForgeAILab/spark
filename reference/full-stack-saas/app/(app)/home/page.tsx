import { desc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { PostsPanel } from './posts-panel';
import { signOutAction } from './actions';

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const rows = await db
    .select()
    .from(posts)
    .where(eq(posts.userId, session.user.id))
    .orderBy(desc(posts.createdAt));

  const initialPosts = rows.map((post) => ({
    id: post.id,
    title: post.title,
    body: post.body,
    createdAt: post.createdAt.toISOString(),
  }));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight" data-testid="greeting">
            Hello {session.user.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {session.user.email}
          </p>
        </div>
        <form action={signOutAction}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>

      <PostsPanel initialPosts={initialPosts} userId={session.user.id} />
    </main>
  );
}
