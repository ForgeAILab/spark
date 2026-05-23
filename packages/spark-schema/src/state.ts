import { z } from 'zod';

export const StateAppendedBlockSchema = z
  .object({
    to: z.string().min(1),
    marker: z.string().min(1),
    content_hash: z.string().min(1).optional(),
  })
  .strict();

export const StateInstalledPackSchema = z
  .object({
    name: z.string().min(1),
    version: z.string().min(1),
    files: z.array(z.string().min(1)).default([]),
    appended_blocks: z.array(StateAppendedBlockSchema).default([]),
    env: z.array(z.string().min(1)).default([]),
    tasks: z.array(z.string().min(1)).default([]),
  })
  .strict();

export const StateFileSchema = z
  .object({
    schema_version: z.literal(1),
    installed_packs: z.array(StateInstalledPackSchema).default([]),
  })
  .strict();

export type StateAppendedBlock = z.infer<typeof StateAppendedBlockSchema>;
export type StateInstalledPack = z.infer<typeof StateInstalledPackSchema>;
export type StateFile = z.infer<typeof StateFileSchema>;
