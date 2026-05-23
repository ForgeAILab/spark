export type RuntimePackageMetadata = {
  package: string;
  version: string;
};

export type PickerPack = {
  name: string;
  category: string;
  description: string;
  provides: readonly string[];
  requires: readonly string[];
  runtimePackage?: RuntimePackageMetadata;
};

export type PickerCategory =
  | 'db'
  | 'auth'
  | 'sync'
  | 'ui'
  | 'ai'
  | 'email'
  | 'analytics'
  | 'deploy'
  | 'infra'
  | 'testing';

export type DbPick = 'db-sqlite' | 'db-postgres' | 'db-supabase' | undefined;

export type GroupedPacks = Record<PickerCategory, PickerPack[]>;

export const pickerCategories = [
  'db',
  'auth',
  'sync',
  'ui',
  'ai',
  'email',
  'analytics',
  'deploy',
  'infra',
  'testing',
] as const satisfies readonly PickerCategory[];

const categorySet = new Set<PickerCategory>(pickerCategories);

function emptyGroups(): GroupedPacks {
  return {
    db: [],
    auth: [],
    sync: [],
    ui: [],
    ai: [],
    email: [],
    analytics: [],
    deploy: [],
    infra: [],
    testing: [],
  };
}

function pickerCategoryFor(pack: PickerPack): PickerCategory | undefined {
  if (pack.name === 'sync-zero' || pack.provides.includes('sync')) {
    return 'sync';
  }

  if (categorySet.has(pack.category as PickerCategory)) {
    return pack.category as PickerCategory;
  }

  return undefined;
}

function orderByName(packs: readonly PickerPack[], names: readonly string[]): PickerPack[] {
  const byName = new Map(packs.map((pack) => [pack.name, pack]));
  return names.flatMap((name) => {
    const pack = byName.get(name);
    return pack === undefined ? [] : [pack];
  });
}

export function groupByCategory(packs: readonly PickerPack[]): GroupedPacks {
  const groups = emptyGroups();

  for (const pack of packs) {
    const category = pickerCategoryFor(pack);
    if (category !== undefined) {
      groups[category].push(pack);
    }
  }

  return groups;
}

export function orderedForCategory(
  category: PickerCategory,
  packs: readonly PickerPack[],
): PickerPack[] {
  switch (category) {
    case 'db':
      return orderByName(packs, ['db-sqlite', 'db-postgres', 'db-supabase']);
    case 'auth':
      return orderByName(packs, ['auth-better-auth', 'auth-better-auth-pg', 'auth-supabase']);
    case 'sync':
      return orderByName(packs, ['sync-zero']);
    case 'ui':
      return orderByName(packs, ['ui-shadcn']);
    case 'ai':
      return orderByName(packs, ['ai-anthropic', 'ai-openai']);
    case 'email':
      return orderByName(packs, ['email-resend']);
    case 'analytics':
      return orderByName(packs, ['analytics-posthog']);
    case 'deploy':
      return orderByName(packs, ['deploy-vercel']);
    case 'infra':
      return orderByName(packs, ['docker-compose-dev']);
    case 'testing':
      return orderByName(packs, ['testing-playwright']);
  }
}

export function filterAuthByDb(
  authPacks: readonly PickerPack[],
  dbPick: DbPick,
): PickerPack[] {
  if (dbPick === 'db-sqlite') {
    return orderByName(authPacks, ['auth-better-auth']);
  }

  if (dbPick === 'db-postgres') {
    return orderByName(authPacks, ['auth-better-auth-pg']);
  }

  if (dbPick === 'db-supabase') {
    return orderByName(authPacks, ['auth-supabase', 'auth-better-auth-pg']);
  }

  return [];
}

export function filterSyncByDb(
  syncPacks: readonly PickerPack[],
  dbPick: DbPick,
): PickerPack[] {
  if (dbPick === 'db-postgres' || dbPick === 'db-supabase') {
    return orderByName(syncPacks, ['sync-zero']);
  }

  return [];
}

export function recommendedFor(category: PickerCategory, dbPick?: DbPick): string | undefined {
  switch (category) {
    case 'db':
      return 'db-sqlite';
    case 'auth':
      if (dbPick === 'db-sqlite') {
        return 'auth-better-auth';
      }
      if (dbPick === 'db-postgres') {
        return 'auth-better-auth-pg';
      }
      if (dbPick === 'db-supabase') {
        return 'auth-supabase';
      }
      return undefined;
    case 'sync':
      return dbPick === 'db-postgres' ? 'sync-zero' : undefined;
    case 'ui':
      return 'ui-shadcn';
    case 'email':
      return 'email-resend';
    case 'analytics':
      return 'analytics-posthog';
    case 'deploy':
      return 'deploy-vercel';
    case 'testing':
      return 'testing-playwright';
    case 'ai':
    case 'infra':
      return undefined;
  }
}

export function parsePacksFlag(raw: string | undefined): string[] {
  if (raw === undefined) {
    return [];
  }

  return raw
    .split(',')
    .map((pack) => pack.trim())
    .filter((pack) => pack.length > 0);
}
