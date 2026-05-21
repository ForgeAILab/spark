import { z } from 'zod';
import { TemplateCapability } from './capabilities.ts';

const templateNamePattern = /^[a-z][a-z0-9-]*$/;

export const TemplateStatus = z.enum(['stable', 'planned']);
export type TemplateStatus = z.infer<typeof TemplateStatus>;

export const TemplateManifestSchema = z
  .object({
    name: z.string().regex(templateNamePattern, {
      message: 'Template names must match /^[a-z][a-z0-9-]*$/',
    }),
    status: TemplateStatus,
    provides: z.array(TemplateCapability),
    description: z.string().min(1),
  })
  .strict();

export type TemplateManifest = z.infer<typeof TemplateManifestSchema>;
