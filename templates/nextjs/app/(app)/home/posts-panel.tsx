'use client';

import { useState, type FormEvent } from 'react';
import { usePosts } from '@/lib/posts-placeholder';

export function PostsPanel() {
  const { posts, createPost } = usePosts();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    setPending(true);
    try {
      await createPost({ title: title.trim(), body: body.trim() });
      setTitle('');
      setBody('');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3 space-y-4">
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write something…"
          rows={2}
          className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
        <div className="mt-3 flex items-center justify-end">
          <button
            type="submit"
            disabled={pending || !title.trim()}
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? 'Posting…' : 'Post'}
          </button>
        </div>
      </form>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-8 text-center text-sm text-slate-500">
          No posts yet. Install the{' '}
          <code className="rounded bg-slate-100 px-1">sync-zero</code> pack to
          persist and sync posts in real time.
        </div>
      ) : (
        <ul className="space-y-2">
          {posts.map((post) => (
            <li
              key={post.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-slate-900">
                {post.title}
              </h3>
              {post.body && (
                <p className="mt-1 text-sm text-slate-600">{post.body}</p>
              )}
              <p className="mt-2 text-xs text-slate-400">
                {post.createdAt.toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
