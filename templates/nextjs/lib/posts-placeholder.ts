'use client';

import { useMemo } from 'react';
import type { Post } from '@/types/post';

/**
 * Placeholder posts hook.
 *
 * Returns an empty list and a no-op `createPost` until a sync pack
 * (e.g. `sync-zero`) replaces this module with a real Zero client query.
 *
 * Sync packs should export the same `usePosts` signature so the UI in
 * `app/(app)/page.tsx` keeps working without further edits.
 */
export interface UsePostsResult {
  posts: Post[];
  createPost: (input: { title: string; body: string }) => Promise<void>;
}

export function usePosts(): UsePostsResult {
  return useMemo<UsePostsResult>(
    () => ({
      posts: [],
      createPost: async () => {
        // TODO: replaced by `sync-zero` (or another sync pack).
      },
    }),
    [],
  );
}
