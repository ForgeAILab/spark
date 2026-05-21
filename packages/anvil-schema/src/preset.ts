import { z } from 'zod';

const packNamePattern = /^[a-z][a-z0-9-]*$/;

export const PresetManifestSchema = z
  .object({
    name: z
      .string()
      .regex(packNamePattern, {
        message: 'Preset names must match /^[a-z][a-z0-9-]*$/',
      })
      .optional(),
    description: z.string().min(1).optional(),
    compatible_scaffolds: z.array(z.string().min(1)),
    packs: z.array(
      z.string().regex(packNamePattern, {
        message: 'Pack names must match /^[a-z][a-z0-9-]*$/',
      }),
    ),
  })
  .strict();

export type PresetManifest = z.infer<typeof PresetManifestSchema>;
