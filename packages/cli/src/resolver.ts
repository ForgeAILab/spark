import {
  EXCLUSIVE_CAPABILITIES,
  type PackCapability,
  type PackManifest,
  type TemplateCapability,
  type TemplateManifest,
} from '@app-skills/pack-schema';

export type PackRegistryEntry = {
  name: string;
  manifest: PackManifest;
  dir?: string;
};

export type ResolverRegistry = {
  packs: ReadonlyMap<string, PackRegistryEntry>;
};

export type ResolverTemplate = Pick<TemplateManifest, 'name' | 'provides'>;

export type InstallPlanPack = {
  name: string;
  manifest: PackManifest;
};

export type InstallPlan = {
  packs: InstallPlanPack[];
  alreadyInstalled: string[];
};

export type MissingCapabilityError = {
  type: 'missing-capability';
  pack: string;
  capability: PackCapability;
  providers: string[];
};

export type ExclusiveConflictError = {
  type: 'exclusive-conflict';
  capability: PackCapability;
  packs: [string, string];
  source: 'exclusive-capability' | 'declared-conflict';
};

export type ScaffoldIncompatError = {
  type: 'scaffold-incompat';
  pack: string;
  activeScaffold: string;
  compatibleScaffolds: string[];
};

export type RuntimeIncompatError = {
  type: 'runtime-incompat';
  pack: string;
  activeScaffold: string;
  missingRuntime: TemplateCapability;
  providedRuntime: TemplateCapability[];
};

export type CircularError = {
  type: 'circular';
  cycle: string[];
};

export type UnknownPackError = {
  type: 'unknown-pack';
  pack: string;
};

export type ResolverError =
  | MissingCapabilityError
  | ExclusiveConflictError
  | ScaffoldIncompatError
  | RuntimeIncompatError
  | CircularError
  | UnknownPackError;

export type Result<TData, TError> =
  | {
      ok: true;
      data: TData;
    }
  | {
      ok: false;
      error: TError;
    };

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function providedCapabilities(manifest: PackManifest): ReadonlySet<PackCapability> {
  return new Set(manifest.provides);
}

function packProvides(entry: PackRegistryEntry, capability: PackCapability): boolean {
  return providedCapabilities(entry.manifest).has(capability);
}

function findProviders(
  registry: ResolverRegistry,
  capability: PackCapability,
  names: Iterable<string> = registry.packs.keys(),
): string[] {
  const providers: string[] = [];

  for (const name of names) {
    const entry = registry.packs.get(name);
    if (entry && packProvides(entry, capability)) {
      providers.push(name);
    }
  }

  return providers.sort();
}

function firstScaffoldError(
  packName: string,
  manifest: PackManifest,
  activeTemplate: ResolverTemplate,
): ScaffoldIncompatError | RuntimeIncompatError | undefined {
  if (
    manifest.compatible_scaffolds.length > 0 &&
    !manifest.compatible_scaffolds.includes(activeTemplate.name)
  ) {
    return {
      type: 'scaffold-incompat',
      pack: packName,
      activeScaffold: activeTemplate.name,
      compatibleScaffolds: [...manifest.compatible_scaffolds],
    };
  }

  const providedRuntime = new Set(activeTemplate.provides);
  for (const requiredRuntime of manifest.requires_runtime) {
    if (!providedRuntime.has(requiredRuntime)) {
      return {
        type: 'runtime-incompat',
        pack: packName,
        activeScaffold: activeTemplate.name,
        missingRuntime: requiredRuntime,
        providedRuntime: [...activeTemplate.provides],
      };
    }
  }

  return undefined;
}

function declaredConflict(
  left: PackRegistryEntry,
  right: PackRegistryEntry,
): PackCapability | undefined {
  const rightProvides = providedCapabilities(right.manifest);
  for (const capability of left.manifest.conflicts) {
    if (rightProvides.has(capability)) {
      return capability;
    }
  }

  const leftProvides = providedCapabilities(left.manifest);
  for (const capability of right.manifest.conflicts) {
    if (leftProvides.has(capability)) {
      return capability;
    }
  }

  return undefined;
}

function exclusiveConflict(
  left: PackRegistryEntry,
  right: PackRegistryEntry,
): PackCapability | undefined {
  const rightProvides = providedCapabilities(right.manifest);

  for (const capability of left.manifest.provides) {
    if (EXCLUSIVE_CAPABILITIES.has(capability) && rightProvides.has(capability)) {
      return capability;
    }
  }

  return undefined;
}

function checkPairConflicts(
  left: PackRegistryEntry,
  right: PackRegistryEntry,
): ExclusiveConflictError | undefined {
  const explicit = declaredConflict(left, right);
  if (explicit) {
    return {
      type: 'exclusive-conflict',
      capability: explicit,
      packs: [left.name, right.name],
      source: 'declared-conflict',
    };
  }

  const exclusive = exclusiveConflict(left, right);
  if (exclusive) {
    return {
      type: 'exclusive-conflict',
      capability: exclusive,
      packs: [left.name, right.name],
      source: 'exclusive-capability',
    };
  }

  return undefined;
}

function sortInstallNames(
  requestedToInstall: readonly string[],
  dependencies: ReadonlyMap<string, ReadonlySet<string>>,
): Result<string[], CircularError> {
  const sorted: string[] = [];
  const state = new Map<string, 'visiting' | 'visited'>();

  function visit(name: string, path: string[]): CircularError | undefined {
    const existingState = state.get(name);
    if (existingState === 'visited') {
      return undefined;
    }

    if (existingState === 'visiting') {
      const cycleStart = path.indexOf(name);
      return {
        type: 'circular',
        cycle: [...path.slice(cycleStart), name],
      };
    }

    state.set(name, 'visiting');
    const deps = [...(dependencies.get(name) ?? [])].sort();
    for (const dependency of deps) {
      const cycle = visit(dependency, [...path, dependency]);
      if (cycle) {
        return cycle;
      }
    }
    state.set(name, 'visited');
    sorted.push(name);
    return undefined;
  }

  for (const name of requestedToInstall) {
    const cycle = visit(name, [name]);
    if (cycle) {
      return { ok: false, error: cycle };
    }
  }

  return { ok: true, data: sorted };
}

export function resolveInstallPlan(
  requestedPacks: readonly string[],
  installedPacks: readonly string[],
  registry: ResolverRegistry,
  activeTemplate: ResolverTemplate,
): Result<InstallPlan, ResolverError> {
  const requested = unique(requestedPacks);
  const installed = unique(installedPacks);
  const installedSet = new Set(installed);

  for (const name of [...requested, ...installed]) {
    if (!registry.packs.has(name)) {
      return { ok: false, error: { type: 'unknown-pack', pack: name } };
    }
  }

  const alreadyInstalled = requested.filter((name) => installedSet.has(name));
  const requestedToInstall = requested.filter((name) => !installedSet.has(name));

  if (requestedToInstall.length === 0) {
    return {
      ok: true,
      data: {
        packs: [],
        alreadyInstalled,
      },
    };
  }

  for (const name of requestedToInstall) {
    const entry = registry.packs.get(name);
    if (!entry) {
      return { ok: false, error: { type: 'unknown-pack', pack: name } };
    }

    const compatibilityError = firstScaffoldError(name, entry.manifest, activeTemplate);
    if (compatibilityError) {
      return { ok: false, error: compatibilityError };
    }
  }

  const finalNames = [...installed, ...requestedToInstall];
  for (let leftIndex = 0; leftIndex < finalNames.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < finalNames.length; rightIndex += 1) {
      const leftName = finalNames[leftIndex];
      const rightName = finalNames[rightIndex];
      const pairIncludesNew = !installedSet.has(leftName) || !installedSet.has(rightName);
      if (!pairIncludesNew) {
        continue;
      }

      const left = registry.packs.get(leftName);
      const right = registry.packs.get(rightName);
      if (!left || !right) {
        return {
          ok: false,
          error: {
            type: 'unknown-pack',
            pack: left ? rightName : leftName,
          },
        };
      }

      const conflict = checkPairConflicts(left, right);
      if (conflict) {
        return { ok: false, error: conflict };
      }
    }
  }

  const dependencyEdges = new Map<string, Set<string>>();

  for (const name of requestedToInstall) {
    const entry = registry.packs.get(name);
    if (!entry) {
      return { ok: false, error: { type: 'unknown-pack', pack: name } };
    }

    dependencyEdges.set(name, new Set<string>());
    for (const capability of entry.manifest.requires) {
      const installedProviders = findProviders(registry, capability, installed);
      const requestedProviders = findProviders(registry, capability, requestedToInstall);

      if (installedProviders.length === 0 && requestedProviders.length === 0) {
        return {
          ok: false,
          error: {
            type: 'missing-capability',
            pack: name,
            capability,
            providers: findProviders(registry, capability),
          },
        };
      }

      if (installedProviders.length === 0) {
        for (const provider of requestedProviders) {
          dependencyEdges.get(name)?.add(provider);
        }
      }
    }
  }

  const sortedNames = sortInstallNames(requestedToInstall, dependencyEdges);
  if (!sortedNames.ok) {
    return sortedNames;
  }

  return {
    ok: true,
    data: {
      packs: sortedNames.data.map((name) => {
        const entry = registry.packs.get(name);
        if (!entry) {
          throw new Error(`Resolved unknown pack "${name}"`);
        }
        return {
          name,
          manifest: entry.manifest,
        };
      }),
      alreadyInstalled,
    },
  };
}
