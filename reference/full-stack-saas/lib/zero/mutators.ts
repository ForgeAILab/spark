import { type CustomMutatorDefs, type Transaction } from '@rocicorp/zero';
import type { Schema } from '@/lib/zero/schema';

export type AuthData = { sub: string; name?: string; email?: string };

export function createMutators(authData: AuthData | undefined) {
  return {
    posts: {
      create: async (
        tx: Transaction<Schema>,
        input: { id: string; title: string; body: string },
      ) => {
        if (!authData) throw new Error('Not authenticated');
        const title = input.title.trim();
        const body = input.body.trim();
        if (!title) throw new Error('Title is required.');
        if (!body) throw new Error('Body is required.');
        await tx.mutate.posts.insert({
          id: input.id,
          user_id: authData.sub,
          title,
          body,
          created_at: Date.now(),
        });
      },
    },
  } as const satisfies CustomMutatorDefs;
}

export type Mutators = ReturnType<typeof createMutators>;
