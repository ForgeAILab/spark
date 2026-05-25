import { z } from 'zod';
import { PackCapability, TemplateCapability } from './capabilities.ts';

const packNamePattern = /^[a-z][a-z0-9-]*$/;
const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

export const PackCategory = z.enum([
  'db',
  'auth',
  'payments',
  'email',
  'ui',
  'ai',
  'infra',
  'testing',
  'deploy',
  'analytics',
  'storage',
  'admin',
]);
export type PackCategory = z.infer<typeof PackCategory>;

export const FileMode = z.enum(['create', 'create-or-skip', 'append', 'merge-json', 'template']);
export type FileMode = z.infer<typeof FileMode>;

export const PackName = z.string().regex(packNamePattern, {
  message: 'Pack names must match /^[a-z][a-z0-9-]*$/',
});
export type PackName = z.infer<typeof PackName>;

export const SemverString = z.string().regex(semverPattern, {
  message: 'Version must be a valid semver string',
});

export const PackDependenciesSchema = z
  .object({
    runtime: z.array(z.string().min(1)).optional(),
    dev: z.array(z.string().min(1)).optional(),
  })
  .strict();

export const PackEnvSchema = z
  .object({
    required: z.array(z.string().min(1)).optional(),
    optional: z.array(z.string().min(1)).optional(),
  })
  .strict();

export const PackFileOperationSchema = z
  .object({
    mode: FileMode,
    from: z.string().min(1),
    to: z.string().min(1),
  })
  .strict();

export const PackSkillsSchema = z
  .object({
    copy: z.array(z.string().min(1)).optional(),
  })
  .strict();

export const PackTasksSchema = z
  .object({
    file: z.string().min(1).optional(),
  })
  .strict();

export const PackManifestSchema = z
  .object({
    name: PackName,
    version: SemverString,
    category: PackCategory,
    description: z.string().min(1).optional(),
    provides: z.array(PackCapability),
    requires: z.array(PackCapability),
    conflicts: z.array(PackCapability),
    requires_runtime: z.array(TemplateCapability),
    compatible_scaffolds: z.array(z.string().min(1)).optional().default([]),
    dependencies: PackDependenciesSchema.optional(),
    env: PackEnvSchema.optional(),
    files: z.array(PackFileOperationSchema).optional(),
    skills: PackSkillsSchema.optional(),
    tasks: PackTasksSchema.optional(),
  })
  .strict();

export type PackManifest = z.infer<typeof PackManifestSchema>;
