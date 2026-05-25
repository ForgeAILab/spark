# Skill Authoring Guide

How to write and improve skills in this repo. A skill is a Markdown file
(`SKILL.md`) that encodes one repeatable operation in the planner / implementer /
evaluator workflow (see `AGENTS.md`). This guide captures the conventions the
existing skills already follow so new and edited skills stay consistent and
trigger reliably.

## Two kinds of skill

| Kind | Lives in | Purpose | Examples |
| --- | --- | --- | --- |
| **Pipeline skill** | `.claude/skills/<name>/SKILL.md` | A workflow stage (grill, spec, board, execute, review, sync). One per stage. | `mvp-grill`, `execute-task`, `code-review` |
| **Pack skill** | `packs/<pack>/skills/<name>/SKILL.md` | Domain patterns that ship with a feature pack and are installed into a project alongside the pack's files. | `ai-feature-patterns`, `supabase-patterns`, `stripe-patterns` |

Both use the same frontmatter contract and the same body skeleton; they differ
mainly in which body sections appear (pipeline skills are procedural; pack skills
are pattern/checklist references).

## Source of truth and the Codex mirror

**`.claude/skills/` is the only place you edit.** `.codex/skills/` is generated
from it by `scripts/sync-skills.ts`. Every generated file carries a
`# Generated from .claude/skills/<name>/SKILL.md — DO NOT EDIT directly` marker.

```bash
bun run scripts/sync-skills.ts      # regenerate .codex/skills from .claude/skills
bun run check:skills                # CI check — fails if .codex is out of sync
```

After adding or editing any `.claude/skills/*/SKILL.md`, run the sync script and
commit both trees together, or `check:skills` will fail.

The mirror transform (`toCodexFrontmatter`) keeps only `name`, `description`, and
`model` in frontmatter and **drops `allowed-tools`** (Codex does not use it). The
body is copied verbatim. Pack skills are *not* mirrored at author time — they are
copied into `.claude/skills/` and `.codex/skills/` of a target project when the
pack is installed (see `docs/pack-spec.md`, `[skills] copy = [...]`).

## Frontmatter contract

```yaml
---
name: execute-task
description: Implement exactly one tasks.md task end-to-end, then report changes and a suggested inline status update. Use when the user says "do TASK-X", "execute the next task", "implement AUTH-001", or hands a task ID to the agent. Do NOT use without a task ID — ask which task, or run `/next-task` first.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---
```

Rules enforced by the parser (`packages/spark/src/internal/skill-utils.ts`):

- The file **must** start with `---` and have a closing `---`.
- `name` and `description` are **required**. Missing either is a hard error.
- `name` must match the directory name and be kebab-case (it is the `/slash`
  command and the `name:` the runtime advertises).
- Keys are unique; no duplicate frontmatter keys.
- Lists use the two-space `  - item` form (see `allowed-tools` above).

Optional keys:

- `allowed-tools` — least-privilege tool list. Grant only what the skill needs.
  Observed defaults: read-only planners use `Read` (+`Write` if they produce a
  `docs/spark/` artifact); reviewers use `Read`, `Bash`, `Grep`; executors use
  `Read`, `Write`, `Edit`, `Bash`. Stripped from the Codex mirror.
- `model` — only set if the skill must pin a model; otherwise state the
  recommendation in the body's `## Recommended model` section instead.

### Writing the `description` (the trigger)

The `description` is how the runtime decides when to fire the skill, so it does
the most work. Every existing skill follows the same three-part shape:

1. **What it does** — one declarative sentence, present tense.
2. **`Use when …`** — concrete trigger phrases the user would actually type,
   in quotes, plus the upstream artifact/state that implies this stage.
3. **`Do NOT use …` → sibling skill** — the negative boundary, pointing at the
   skill that *should* handle the excluded case.

Example (`qa-verify`):

> Verify the app actually runs and the feature works end-to-end, not just that
> code compiles. Use after a feature batch lands, before a demo, when the user
> says "does this actually work?", "run it and check", or before flipping a task
> to Validated / `[x]`. Do NOT use as a substitute for `/code-review` — they
> cover different failure modes.

The `Do NOT` clause prevents adjacent skills from fighting over the same prompt.
When you add a skill near an existing one, update *both* descriptions so the
boundary is mutual.

## Body skeleton

Start the body with an H1 `# Skill: <name>`, then the canonical sections in this
order. The first five are near-universal; include the rest as the skill needs.

```md
# Skill: <name>

## Goal
One paragraph: the outcome and the stance to take (e.g. "skeptical product
partner, not a cheerleader"). Name what the skill must NOT do.

## Recommended model
Which model tier and why (planning vs. execution). Mirrors the
"Model assignment defaults" in AGENTS.md: Opus 4.7 / GPT-5.5 for planning and
review; Sonnet 4.6 / GPT-5 family for routine execution; planning-quality model
for high-risk tasks (auth, payments, migrations, security).

## Inputs
The `docs/spark/` artifacts (and code files, for pack skills) to read first, split
into "required" and "read if present". State the stop condition: when a
precondition is missing or the stage is already done, stop and say so rather
than inventing inputs.

## Rules
The hard constraints, as a bulleted list. This is where scope discipline lives:
"do exactly the task", "read-only by default", "do not edit the board here",
"never mark Validated without independent review". Bold the load-bearing words.

## Workflow            (optional — include for multi-step procedures)
Numbered steps from input to output.

## Output format
The exact shape of what the skill returns — usually a fenced ```md block the
user can paste into a `docs/spark/` artifact (`proposal.md`, `design.md`, a spec
delta, or `tasks.md`). End a pipeline phase by handing control back to the
conductor (`/start`) — do not name the next skill; the order lives in `/start`.
```

After these, add skill-specific sections as needed. Two common patterns:

- **Pipeline phases** (now `start/references/*`) append the literal scaffold of
  the artifact they produce (e.g. `references/architecture.md` has `## Stack`,
  `## Data model (concrete)`, `## Non-goals (the cutline)`; `references/tasks.md`
  embeds the per-task block template).
- **Pack skills** replace `Workflow`/`Output format` with domain sections —
  e.g. `## Prompt Patterns`, `## Streaming UX`, `## Cost Controls`,
  `## Safety and Privacy`, `## Common Pitfalls`, `## Verification`. They read as
  a reference checklist for implementing/reviewing that capability, and usually
  end with a concrete `## Verification` block of observable checks.

## Repo-specific conventions skills must respect

These come from `AGENTS.md` and are assumed by every skill:

- **Source of truth is the `docs/spark/` workspace, not chat.** Skills read and
  write `docs/spark/project.md`, `docs/spark/design.md`, the active change's
  `proposal.md` / `design.md` / `tasks.md`, and EARS `specs/<capability>/spec.md`.
  There is no `.ai/` directory and no stored board file. If an answer isn't in the
  workspace, ask — don't invent it.
- **Board status gates.** `Clarifying → Approved for planning → Approved for
  execution → In progress → Needs review → Validated` (+ `Blocked`,
  `Cut from MVP`). Only `board-review` promotes to `Approved for execution`;
  only review skills lead to `Validated`. Execution never grades itself.
- **Stay in scope.** A skill that implements must not touch files outside the
  task's declared list; discoveries become new `Clarifying` tasks, not silent
  edits.
- **Separation of duties.** Planner, implementer, and evaluator are different
  passes. A skill is exactly one of these — don't let an executor self-review or
  a reviewer rewrite code (reviewers propose patches in prose unless asked).
- **Verification is real.** "Type-check passes" ≠ "feature works". Skills that
  claim done must run an actual command or walk the user journey.

## Authoring checklist

When adding or improving a skill, confirm:

- [ ] Directory name == `name:` == the intended `/slash` command, kebab-case.
- [ ] `description` has the what / `Use when` / `Do NOT use → sibling` shape, with realistic trigger phrases.
- [ ] Adjacent skills' `Do NOT use` clauses point back at this skill (mutual boundary).
- [ ] `allowed-tools` is least-privilege for what the body actually does.
- [ ] Body has `# Skill:` + `Goal` + `Recommended model` + `Inputs` + `Rules` + `Output format`, in that order.
- [ ] `Inputs` lists the `docs/spark/` (and code) files and a stop condition for missing preconditions.
- [ ] `Rules` encodes scope, gate, and separation-of-duties constraints relevant to this stage.
- [ ] `Output format` is a paste-ready block and ends with a `Next` pointer (for pipeline skills).
- [ ] Ran `bun run scripts/sync-skills.ts` and committed the `.codex/skills/` mirror change too.
- [ ] `bun run check:skills` passes.

## Adding a new skill

**Pipeline skill:**

1. Create `.claude/skills/<name>/SKILL.md` with the frontmatter and skeleton above.
2. If it's a new workflow stage, add a row to the `Skill / command equivalents`
   table in `AGENTS.md`.
3. `bun run scripts/sync-skills.ts` to generate the Codex mirror.
4. `bun test scripts` and `bun run check:skills`.

**Pack skill:** use the `new-pack` skill (or follow `docs/pack-spec.md`). Author
the skill under `packs/<pack>/skills/<name>/SKILL.md` and list its folder in the
pack manifest's `[skills] copy = ["skills/<name>"]`. Pack skills are mirrored
into a target project at install time, not in this repo's `.codex/` tree.
