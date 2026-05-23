'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useQuery, useZero } from '@rocicorp/zero/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { schema, zql } from '@/lib/zero/schema';
import type { Mutators } from '@/lib/zero/mutators';

type PostView = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

type PostsPanelProps = {
  initialPosts: PostView[];
  userId: string;
};

function formatRelative(input: string | number): string {
  const created = typeof input === 'number' ? input : new Date(input).getTime();
  if (Number.isNaN(created)) return '';

  const diffMs = Date.now() - created;
  const diffSec = Math.max(1, Math.round(diffMs / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

export function PostsPanel({ initialPosts, userId: _userId }: PostsPanelProps) {
  const z = useZero<typeof schema, Mutators>();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  // Live query: subscribes to the `posts` table via Zero. When zero-cache replicates
  // a new row from Postgres, every tab with this query open re-renders automatically.
  const [livePosts] = useQuery(zql.posts.orderBy('created_at', 'desc').limit(50));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get('title') ?? '');
    const body = String(formData.get('body') ?? '');

    setError(undefined);
    setIsPending(true);

    try {
      const result = z.mutate.posts.create({
        id: crypto.randomUUID(),
        title,
        body,
      });
      const clientResult = await result.client;

      if (clientResult.type === 'error') {
        throw new Error(clientResult.error.message);
      }

      formRef.current?.reset();
      void result.server
        .then((serverResult) => {
          if (serverResult.type === 'error') {
            setError(serverResult.error.message);
          }
        })
        .catch((serverError) => {
          const message =
            serverError instanceof Error ? serverError.message : 'Unable to sync post.';
          setError(message);
        });
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Unable to create post.';
      setError(message);
    } finally {
      setIsPending(false);
    }
  }

  // Hydrate from server props on first paint; switch to the live result as soon as
  // Zero delivers it. This keeps SSR fast and avoids an empty-state flicker.
  const posts =
    livePosts.length > 0
      ? livePosts.map((row) => ({
          id: row.id,
          title: row.title,
          body: row.body,
          createdAt:
            typeof row.created_at === 'number' ? new Date(row.created_at).toISOString() : '',
        }))
      : initialPosts;

  return (
    <section className="flex flex-col gap-6" data-testid="posts-panel">
      <Card>
        <CardContent className="p-6">
          <form
            className="grid gap-4"
            data-testid="create-post-form"
            onSubmit={handleSubmit}
            ref={formRef}
          >
            <label className="grid gap-2 text-sm font-medium">
              Title
              <input
                autoComplete="off"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-testid="post-title-input"
                name="title"
                placeholder="What's the headline?"
                required
                type="text"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Body
              <textarea
                className="min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-testid="post-body-input"
                name="body"
                placeholder="Write your post..."
                required
              />
            </label>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Posts are written optimistically via Zero and resolved against Postgres on
                reconnect.
              </p>
              <Button data-testid="create-post-submit" disabled={isPending} type="submit">
                {isPending ? 'Creating...' : 'Create post'}
              </Button>
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3" data-testid="posts-list">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground" data-testid="posts-empty">
              No posts yet. Create your first one above.
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card data-testid="post-card" key={post.id}>
              <CardContent className="flex flex-col gap-2 p-6">
                <h2 className="text-lg font-semibold leading-tight" data-testid="post-title">
                  {post.title}
                </h2>
                <p className="text-sm leading-6 text-foreground" data-testid="post-body">
                  {post.body}
                </p>
                <p
                  className="text-xs text-muted-foreground"
                  data-testid="post-created"
                  title={post.createdAt}
                >
                  {formatRelative(post.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
