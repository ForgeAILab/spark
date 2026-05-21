import { parse } from 'smol-toml';
import { z } from 'zod';
import { PackManifestSchema, type PackManifest } from './pack.ts';
import { PresetManifestSchema, type PresetManifest } from './preset.ts';
import { TemplateManifestSchema, type TemplateManifest } from './template.ts';

export type ParseError = {
  message: string;
  issues?: string[];
};

export type Result<TData, TError> =
  | {
      ok: true;
      data: TData;
    }
  | {
      ok: false;
      error: TError;
    };

const forbiddenPackKeys = [
  'post_install',
  'hooks',
  'pre_add',
  'pre_install',
  'post_add',
  'scripts',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatIssuePath(path: PropertyKey[]): string {
  return path.length === 0 ? '<root>' : path.map(String).join('.');
}

function toParseError(error: unknown): ParseError {
  if (error instanceof z.ZodError) {
    return {
      message: 'Manifest validation failed',
      issues: error.issues.map((issue) => `${formatIssuePath(issue.path)}: ${issue.message}`),
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: 'Unknown TOML parse error',
  };
}

export function assertNoForbiddenPackFields(parsed: unknown): void {
  if (!isRecord(parsed)) {
    return;
  }

  for (const key of forbiddenPackKeys) {
    if (Object.hasOwn(parsed, key)) {
      throw new Error(
        `Unsupported pack manifest field "${key}" is forbidden; pack installs are declarative and cannot run shell hooks.`,
      );
    }
  }
}

export function parsePackToml(raw: string): Result<PackManifest, ParseError> {
  try {
    const parsed = parse(raw);
    assertNoForbiddenPackFields(parsed);

    return {
      ok: true,
      data: PackManifestSchema.parse(parsed),
    };
  } catch (error) {
    return {
      ok: false,
      error: toParseError(error),
    };
  }
}

export function parseTemplateToml(raw: string): Result<TemplateManifest, ParseError> {
  try {
    return {
      ok: true,
      data: TemplateManifestSchema.parse(parse(raw)),
    };
  } catch (error) {
    return {
      ok: false,
      error: toParseError(error),
    };
  }
}

export function parsePresetToml(raw: string): Result<PresetManifest, ParseError> {
  try {
    return {
      ok: true,
      data: PresetManifestSchema.parse(parse(raw)),
    };
  } catch (error) {
    return {
      ok: false,
      error: toParseError(error),
    };
  }
}
