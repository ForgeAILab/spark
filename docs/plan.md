## Recommended reusable skill pack

Store them like this:

```txt
.ai/
  board.md
  product-spec.md
  architecture.md
  decision-log.md
  execution-log.md
  prompts/
    mvp-grill.md
    board-schema.md

.claude/
  skills/
    mvp-grill/
      SKILL.md
    mvp-spec/
      SKILL.md
    mvp-board/
      SKILL.md
    task-splitter/
      SKILL.md
    implementation-brief/
      SKILL.md
    parallel-execution/
      SKILL.md
    code-review/
      SKILL.md
    qa-verify/
      SKILL.md
    demo-polish/
      SKILL.md
    changelog-sync/
      SKILL.md
```

For Codex, mirror the important operating rules into `AGENTS.md`, because Codex uses repo instructions and also documents skills, subagents, hooks, rules, permissions, and MCP as configurable concepts. Codex CLI can inspect the repo, edit files, run commands, and supports local terminal workflows. ([OpenAI Developers][2])

---

## P0 skills: the core Lovable/Manus-like loop

### 1. `/mvp-grill`

**Purpose:** Start from a messy idea and grill you until it becomes buildable.

**Use when:** You say: “I want to build X,” “help me make an MVP,” or “is this idea good?”

**Model:** Opus or GPT-5.5.

**Output:**

```txt
.ai/product-spec.md
.ai/decision-log.md
```

**What it should do:**

Ask only the questions that affect execution. It should not over-research or over-plan. It should force clarity on:

```txt
target user
pain point
main workflow
must-have features
out-of-scope features
data model
auth/payment requirement
integration requirement
visual direction
launch constraint
success metric
```

**Rule:** Max 5 questions per round. Stop grilling once the idea is “MVP-ready enough.”

---

### 2. `/idea-sharpen`

**Purpose:** Turn a weak or broad idea into 2–3 sharper MVP options.

**Use when:** You have an idea but not sure the angle is right.

**Model:** Opus or GPT-5.5.

**Output:**

```txt
Option A: fastest MVP
Option B: more differentiated
Option C: most monetizable
Recommendation: choose one
```

**Example:**

```txt
/mvp-sharpen "AI workspace for indie hackers to build apps faster"
```

This skill should challenge the idea like a product strategist, not just agree with you.

---

### 3. `/mvp-spec`

**Purpose:** Convert the grilled idea into a clear MVP spec.

**Use when:** You are ready to stop discussing and produce a plan.

**Model:** Opus or GPT-5.5.

**Output:**

```txt
.ai/product-spec.md
```

**Spec sections:**

```txt
1. One-sentence product
2. Target user
3. Core user journey
4. MVP feature list
5. Explicit non-goals
6. Data model
7. Screens/pages
8. Integrations
9. Risks
10. Acceptance criteria
```

**Important:** This should be technical enough that Sonnet/Claude Code can execute without guessing.

---

### 4. `/architecture-cutline`

**Purpose:** Pick the simplest architecture that can actually ship.

**Use when:** After the MVP spec exists.

**Model:** Opus or GPT-5.5.

**Output:**

```txt
.ai/architecture.md
```

**It should decide:**

```txt
frontend framework
backend/API approach
database
auth
storage
payments
deployment
repo structure
testing strategy
what not to build yet
```

**Rule:** This skill should aggressively remove overengineering. Its job is to say: “For MVP, do not build X yet.”

---

### 5. `/ux-theme`

**Purpose:** Create the visual/product direction before coding starts.

**Use when:** You want Lovable-like “theme control.”

**Model:** Opus/GPT-5.5 for direction, Sonnet for implementation.

**Output:**

```txt
.ai/ux-theme.md
```

**It should define:**

```txt
product vibe
layout style
color direction
typography feel
component style
empty states
dashboard/table/card patterns
example products to imitate
design constraints
```

**Example directions:**

```txt
Linear-style productivity SaaS
Notion-like workspace
Vercel-like developer tool
Stripe-like admin dashboard
Arc-like playful consumer app
```

---

## P0 board and execution skills

### 6. `/mvp-board`

**Purpose:** Convert spec + architecture into an executable board.

**Use when:** Product spec and architecture are ready.

**Model:** Opus/GPT-5.5.

**Output:**

```txt
.ai/board.md
```

**Board format:**

```txt
EPIC
  TASK
    Status: todo | doing | blocked | review | done
    Owner: planner | sonnet | reviewer | user
    Depends on:
    Can run in parallel: yes/no
    Acceptance criteria:
    Files likely touched:
    Execution prompt:
```

**This is the most important skill.** It creates the thing you can load into Forge, GitHub Issues, Linear, Trello, or just use as a Markdown execution board.

---

### 7. `/task-splitter`

**Purpose:** Break a big board task into Claude Code-sized execution tasks.

**Use when:** A task is too vague, such as “build dashboard.”

**Model:** Opus/GPT-5.5 or Sonnet.

**Output:**

```txt
Task 1: create route and layout
Task 2: create mock data
Task 3: create reusable components
Task 4: wire data
Task 5: add empty/loading/error states
Task 6: verify
```

**Rule:** Each task should fit in one Claude Code session.

---

### 8. `/implementation-brief`

**Purpose:** Generate the exact prompt for Sonnet/Claude Code to execute one board task.

**Use when:** You want to hand a task to the coding agent.

**Model:** Opus/GPT-5.5.

**Output:**

```txt
Task brief for executor
Context
Goal
Non-goals
Acceptance criteria
Files to inspect first
Likely files to edit
Commands to run
Definition of done
```

**This is the skill that prevents Sonnet from wandering.**

Example:

```txt
/implementation-brief board-task AUTH-003
```

---

### 9. `/parallel-execution`

**Purpose:** Decide which tasks can run at the same time.

**Use when:** You want multi-agent execution.

**Model:** Opus/GPT-5.5.

**Output:**

```txt
Batch 1:
  - DB schema
  - UI theme setup
  - route skeletons

Batch 2:
  - auth flow
  - dashboard UI
  - seed data

Batch 3:
  - integration
  - QA
  - deployment
```

**Rule:** It must identify conflicts:

```txt
shared files
schema dependencies
routing dependencies
component dependencies
migration dependencies
```

This works well with Claude Code subagents or separate sessions, because subagents are specifically designed to preserve context, specialize behavior, and isolate work. Claude Code also supports background agents and multiple sessions for parallel work. ([Claude API Docs][3])

---

### 10. `/board-review`

**Purpose:** Review the board before execution.

**Use when:** You want to sanity-check the plan.

**Model:** Opus/GPT-5.5.

**Output:**

```txt
Missing tasks
Tasks that are too big
Wrong dependencies
Risky parallel tasks
Overbuilt parts
Suggested revised board
```

**This should be your “technical founder review” skill.**

---

## P1 coding-agent execution skills

### 11. `/execute-task`

**Purpose:** Let Sonnet execute one board task and update progress.

**Use when:** In Claude Code or Codex.

**Model:** Sonnet.

**Output:**

```txt
code changes
test results
summary
board status update
next suggested task
```

**Rule:** It should only execute the selected task. No extra features.

Prompt shape:

```txt
Execute only task <TASK_ID> from .ai/board.md.
Read .ai/product-spec.md and .ai/architecture.md first.
Do not modify unrelated areas.
After implementation:
1. run relevant tests/checks
2. summarize changed files
3. update task status suggestion
4. list follow-up tasks
```

---

### 12. `/summarize-changes`

**Purpose:** Summarize current git diff before review.

**Use when:** After each execution step.

**Model:** Sonnet.

**Output:**

```txt
Changed files
What changed
Why it changed
Risk areas
Tests run
Suggested commit message
```

Claude’s docs show this exact style of skill: a skill can inject `git diff HEAD` into the prompt so Claude reviews real working-tree changes instead of guessing. ([Claude API Docs][1])

---

### 13. `/code-review`

**Purpose:** Review implementation against acceptance criteria.

**Use when:** Before marking board task done.

**Model:** Opus/GPT-5.5 for high-risk tasks, Sonnet for normal tasks.

**Output:**

```txt
Pass/fail
Issues
Missing acceptance criteria
Security concerns
UX concerns
Suggested patch
```

**Rule:** Reviewer should be read-only unless explicitly asked to fix.

---

### 14. `/qa-verify`

**Purpose:** Verify the app actually runs, not just that code compiles.

**Use when:** After a feature batch.

**Model:** Sonnet.

**Output:**

```txt
Run commands
Manual test path
Broken flows
Screens/pages checked
Fix recommendations
```

Claude Code already has bundled `/run`, `/verify`, and `/run-skill-generator` skills that can launch and verify an app. `/run-skill-generator` records the project-specific run recipe so future agents do not rediscover it every time. ([Claude API Docs][1])

---

### 15. `/bug-hunt`

**Purpose:** Find bugs after a batch of work.

**Use when:** Before demo or deploy.

**Model:** Sonnet first, Opus/GPT-5.5 for deeper review.

**Output:**

```txt
Critical bugs
Likely broken flows
Edge cases
Fix order
Board tasks to add
```

---

## P1 product polish skills

### 16. `/demo-polish`

**Purpose:** Make the MVP feel impressive fast.

**Use when:** Core functionality works but product feels rough.

**Model:** Opus/GPT-5.5 for prioritization, Sonnet for execution.

**Output:**

```txt
Top 10 polish improvements
Which ones matter for demo
Which ones are cosmetic
Suggested implementation order
```

Focus areas:

```txt
empty states
loading states
first-run experience
sample data
hero copy
button labels
layout spacing
navigation clarity
mobile roughness
```

---

### 17. `/landing-page-copy`

**Purpose:** Generate landing page content from the MVP spec.

**Use when:** You need a launch page quickly.

**Model:** Opus/GPT-5.5.

**Output:**

```txt
hero
subheadline
3 benefits
how it works
use cases
pricing teaser
FAQ
CTA
```

---

### 18. `/onboarding-flow`

**Purpose:** Design the first 5 minutes of user experience.

**Use when:** Before polish or demo.

**Model:** Opus/GPT-5.5.

**Output:**

```txt
first screen
setup steps
default sample data
aha moment
empty states
activation metric
```

This is important because many AI-built MVPs have features but no coherent first-use path.

---

## P1 progress, board, and project management skills

### 19. `/sync-board`

**Purpose:** Update `.ai/board.md` based on actual code progress.

**Use when:** After every execution session.

**Model:** Sonnet.

**Output:**

```txt
task statuses updated
new tasks discovered
blocked tasks
completed tasks
next recommended batch
```

**This is the key skill for your Forge-style board workflow.**

---

### 20. `/next-task`

**Purpose:** Pick the next best task.

**Use when:** You don’t want to manually decide.

**Model:** Opus/GPT-5.5.

**Output:**

```txt
Recommended next task
Why now
Dependencies satisfied
Risk level
Execution prompt
```

**Decision order:**

```txt
unblock core flow first
avoid polish before core works
prefer tasks with clear acceptance criteria
batch parallel-safe tasks
run QA after every feature batch
```

---

### 21. `/risk-check`

**Purpose:** Detect whether the project is drifting.

**Use when:** Every few sessions.

**Model:** Opus/GPT-5.5.

**Output:**

```txt
Scope creep
Architecture creep
Unclear tasks
Missing tests
Hidden dependencies
Suggested cuts
```

This is the anti-overthinking skill.

---

### 22. `/decision-log`

**Purpose:** Record important choices.

**Use when:** You choose a stack, cut a feature, change architecture, or accept a tradeoff.

**Model:** Any.

**Output:**

```txt
Decision
Context
Alternatives considered
Why chosen
Risk
Revisit condition
```

**File:**

```txt
.ai/decision-log.md
```

---

## P2 deployment and launch skills

### 23. `/deploy-check`

**Purpose:** Prepare the MVP for deployment.

**Use when:** App works locally.

**Model:** Sonnet.

**Output:**

```txt
env vars
build command
migration command
runtime assumptions
deployment target
known issues
```

---

### 24. `/release-notes`

**Purpose:** Summarize what changed into founder-readable release notes.

**Use when:** After a milestone.

**Model:** Sonnet.

**Output:**

```txt
Shipped
Changed
Fixed
Known issues
Next milestone
```

---

### 25. `/launch-readiness`

**Purpose:** Decide whether the MVP is ready to show users.

**Use when:** Before sending to testers.

**Model:** Opus/GPT-5.5.

**Output:**

```txt
Ready / not ready
Blocking issues
Acceptable rough edges
Demo script
Tester instructions
Feedback questions
```

---

## P2 reusable stack-specific skills

These are optional but very useful if you build many MVPs with the same stack.

### 26. `/nextjs-app-router-patterns`

Reusable rules for routes, layouts, server actions, loading states, error states, and folder structure.

### 27. `/supabase-patterns`

Reusable rules for auth, RLS, database schema, storage, and migrations.

### 28. `/stripe-patterns`

Reusable rules for checkout, subscriptions, webhooks, pricing tables, and test mode.

### 29. `/shadcn-dashboard-patterns`

Reusable rules for tables, forms, cards, dialogs, command menus, and responsive dashboard layouts.

### 30. `/ai-feature-patterns`

Reusable rules for chat UI, structured outputs, streaming, tool calls, evals, and prompt storage.

These should be stack memory, not project planning skills.

---

## My suggested first 10 to actually create

Do not create all 30 first. Start with this tight set:

```txt
1. /mvp-grill
2. /idea-sharpen
3. /mvp-spec
4. /architecture-cutline
5. /ux-theme
6. /mvp-board
7. /implementation-brief
8. /parallel-execution
9. /execute-task
10. /sync-board
```

Then add:

```txt
11. /code-review
12. /qa-verify
13. /demo-polish
14. /launch-readiness
```

That gives you the full loop:

```txt
idea
→ grill
→ spec
→ architecture
→ theme
→ board
→ execution brief
→ Sonnet executes
→ board sync
→ review
→ verify
→ iterate
```

---

## Skill template I’d reuse for every skill

```md
---
description: When to use this skill. Be specific enough that the agent does not trigger it randomly.
allowed-tools:
  - Read
  - Write
  - Bash
---

# Skill: <name>

## Goal

What this skill does.

## Inputs

Read these files first if they exist:

- .ai/product-spec.md
- .ai/architecture.md
- .ai/board.md
- .ai/decision-log.md

## Rules

- Stay focused on the current stage.
- Do not add unrelated features.
- Prefer small, reviewable outputs.
- If information is missing, ask only the minimum questions needed.
- Update the relevant `.ai/` artifact.

## Output format

Return:

1. Summary
2. Main output
3. Risks / assumptions
4. Next recommended action
```

---

## How I’d map models

```txt
Opus / GPT-5.5:
  /mvp-grill
  /idea-sharpen
  /mvp-spec
  /architecture-cutline
  /mvp-board
  /parallel-execution
  /risk-check
  /launch-readiness

Sonnet:
  /execute-task
  /summarize-changes
  /sync-board
  /qa-verify
  /bug-hunt
  /deploy-check
  /release-notes

Either:
  /ux-theme
  /code-review
  /demo-polish
```

The pattern is simple: **strong model plans, cheaper/faster model executes, strong model reviews risky decisions.**

---

## The board file should be the center

Your `.ai/board.md` should become the “source of truth,” whether or not Forge is used.

Example:

```md
# MVP Board

## Rules

- Only execute one task at a time unless marked parallel-safe.
- Every task must have acceptance criteria.
- Every completed task must include changed files and verification result.
- New discoveries become new tasks, not silent scope expansion.

---

## EPIC 1: Project Setup

### TASK SETUP-001: Scaffold app
Status: todo
Priority: P0
Owner: sonnet
Depends on: none
Parallel-safe: yes
Risk: low

Acceptance criteria:
- App boots locally
- Basic layout renders
- Lint/typecheck passes

Execution prompt:
Use /implementation-brief SETUP-001, then execute only this task.
```

This is the artifact you can copy into Forge later as tasks, or keep as a plain Markdown board.

---

## Hooks worth adding later

Claude Code hooks can run around events like tool use, task creation/completion, file changes, worktree creation/removal, and session lifecycle events, so they are useful once you want the workflow to update logs or enforce safety automatically. ([Claude API Docs][4])

Useful hooks:

```txt
after file edit:
  run formatter

before commit:
  run lint/typecheck

after task completed:
  update .ai/execution-log.md

before shell command:
  block dangerous commands unless approved

after worktree created:
  copy .ai/board.md and project docs
```

Start manually with skills first. Add hooks only when the process becomes repetitive.

---

My recommendation: build the skill pack around **board-first execution**, not chat-first execution. Chat is for steering. The board is for truth. The skills are the reusable operating system around it.

[1]: https://docs.anthropic.com/en/docs/claude-code/skills "Extend Claude with skills - Claude Code Docs"
[2]: https://developers.openai.com/codex "Codex | OpenAI Developers"
[3]: https://docs.anthropic.com/en/docs/claude-code/sub-agents "Create custom subagents - Claude Code Docs"
[4]: https://docs.anthropic.com/en/docs/claude-code/hooks "Hooks reference - Claude Code Docs"
