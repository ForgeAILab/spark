# @forgeailab/anvil-skill-utils

Utilities for parsing `SKILL.md` frontmatter and converting skill metadata between Claude and Codex mirrors.

## API

- `parseSkillFrontmatter(source)` parses a leading YAML frontmatter block and returns `{ frontmatter, body }`.
- `toCodexFrontmatter(claude)` keeps the Codex-supported keys from Claude frontmatter: `name`, `description`, and optional `model`.
- `toClaudeFrontmatter(codex)` returns a Claude-compatible frontmatter object from Codex metadata.
- `serializeSkillFrontmatter(frontmatter)` serializes parsed or transformed frontmatter while preserving parsed block formatting.
