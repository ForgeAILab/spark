type FrontmatterBlockMap = Map<string, string[]>;

const rawBlocksSymbol = Symbol.for('@forgeailab/spark-skill-utils.rawBlocks');
const requiredFrontmatterKeys = ['name', 'description'] as const;
const codexFrontmatterKeys = ['name', 'description', 'model'] as const;

type FrontmatterWithBlocks = Record<string, unknown> & {
  [rawBlocksSymbol]?: FrontmatterBlockMap;
};

export type ParsedSkillMarkdown = {
  frontmatter: Record<string, unknown>;
  body: string;
};

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function attachRawBlocks<T extends Record<string, unknown>>(
  frontmatter: T,
  blocks: FrontmatterBlockMap,
): T {
  Object.defineProperty(frontmatter, rawBlocksSymbol, {
    value: blocks,
    enumerable: false,
  });

  return frontmatter;
}

function rawBlocks(frontmatter: Record<string, unknown>): FrontmatterBlockMap | undefined {
  return (frontmatter as FrontmatterWithBlocks)[rawBlocksSymbol];
}

function splitFrontmatter(source: string): { frontmatter: string; body: string } {
  const normalized = source.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');

  if (lines[0] !== '---') {
    throw new Error('SKILL.md must start with YAML frontmatter');
  }

  const closingIndex = lines.findIndex((line, index) => index > 0 && line === '---');
  if (closingIndex === -1) {
    throw new Error('SKILL.md frontmatter is missing a closing --- delimiter');
  }

  return {
    frontmatter: lines.slice(1, closingIndex).join('\n'),
    body: lines.slice(closingIndex + 1).join('\n'),
  };
}

function parseScalar(value: string): unknown {
  const trimmed = value.trim();

  if (trimmed === 'true') {
    return true;
  }

  if (trimmed === 'false') {
    return false;
  }

  return trimmed;
}

function parseBlockValue(lines: string[]): unknown {
  const [firstLine, ...rest] = lines;
  const valueStart = firstLine.indexOf(':') + 1;
  const firstValue = firstLine.slice(valueStart);

  if (rest.length === 0) {
    return parseScalar(firstValue);
  }

  if (
    firstValue.trim() === '' &&
    rest.every((line) => line.trim() === '' || /^\s*-\s+/u.test(line))
  ) {
    return rest
      .filter((line) => line.trim() !== '')
      .map((line) => parseScalar(line.replace(/^\s*-\s+/u, '')));
  }

  return [firstValue.trim(), ...rest].join('\n');
}

function parseFrontmatterBlocks(frontmatter: string): Record<string, unknown> {
  const blocks: FrontmatterBlockMap = new Map();
  const parsed: Record<string, unknown> = {};
  let currentKey: string | undefined;

  for (const line of frontmatter.split('\n')) {
    const match = /^([A-Za-z][A-Za-z0-9_-]*):(.*)$/u.exec(line);

    if (match) {
      currentKey = match[1];
      if (blocks.has(currentKey)) {
        throw new Error(`Duplicate frontmatter key: ${currentKey}`);
      }
      blocks.set(currentKey, [`${currentKey}:${match[2]}`]);
      continue;
    }

    if (!currentKey) {
      if (line.trim() === '' || line.trim().startsWith('#')) {
        continue;
      }
      throw new Error(`Unexpected frontmatter line before a key: ${line}`);
    }

    blocks.get(currentKey)?.push(line);
  }

  for (const key of requiredFrontmatterKeys) {
    if (!blocks.has(key)) {
      throw new Error(`Missing required frontmatter key: ${key}`);
    }
  }

  for (const [key, lines] of blocks) {
    parsed[key] = parseBlockValue(lines);
  }

  return attachRawBlocks(parsed, blocks);
}

function copyRawBlock(
  source: FrontmatterBlockMap | undefined,
  target: FrontmatterBlockMap,
  key: string,
): void {
  const block = source?.get(key);
  if (block) {
    target.set(key, [...block]);
  }
}

function assertRequiredFrontmatter(frontmatter: Record<string, unknown>): void {
  for (const key of requiredFrontmatterKeys) {
    if (!hasOwn(frontmatter, key)) {
      throw new Error(`Missing required frontmatter key: ${key}`);
    }
  }
}

function serializeScalar(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  return String(value);
}

function serializeKeyValue(key: string, value: unknown): string[] {
  if (Array.isArray(value)) {
    return [`${key}:`, ...value.map((item) => `  - ${serializeScalar(item)}`)];
  }

  if (typeof value === 'string' && value.includes('\n')) {
    const [firstLine, ...rest] = value.split('\n');
    return [`${key}: ${firstLine}`, ...rest];
  }

  return [`${key}: ${serializeScalar(value)}`];
}

export function parseSkillFrontmatter(source: string): ParsedSkillMarkdown {
  const { frontmatter, body } = splitFrontmatter(source);

  return {
    frontmatter: parseFrontmatterBlocks(frontmatter),
    body,
  };
}

export function toCodexFrontmatter(claude: Record<string, unknown>): Record<string, unknown> {
  assertRequiredFrontmatter(claude);

  const sourceBlocks = rawBlocks(claude);
  const codex: Record<string, unknown> = {};
  const codexBlocks: FrontmatterBlockMap = new Map();

  for (const key of codexFrontmatterKeys) {
    if (!hasOwn(claude, key)) {
      continue;
    }

    codex[key] = claude[key];
    copyRawBlock(sourceBlocks, codexBlocks, key);
  }

  return attachRawBlocks(codex, codexBlocks);
}

export function toClaudeFrontmatter(codex: Record<string, unknown>): Record<string, unknown> {
  assertRequiredFrontmatter(codex);

  const sourceBlocks = rawBlocks(codex);
  const claude: Record<string, unknown> = {};
  const claudeBlocks: FrontmatterBlockMap = new Map();

  for (const key of Object.keys(codex)) {
    claude[key] = codex[key];
    copyRawBlock(sourceBlocks, claudeBlocks, key);
  }

  return attachRawBlocks(claude, claudeBlocks);
}

export function serializeSkillFrontmatter(
  frontmatter: Record<string, unknown>,
  options: { trailingComments?: readonly string[] } = {},
): string {
  const blocks = rawBlocks(frontmatter);
  const output: string[] = [];

  for (const key of Object.keys(frontmatter)) {
    const block = blocks?.get(key);
    if (block) {
      output.push(...block);
      continue;
    }

    output.push(...serializeKeyValue(key, frontmatter[key]));
  }

  output.push(...(options.trailingComments ?? []));

  return output.join('\n');
}
