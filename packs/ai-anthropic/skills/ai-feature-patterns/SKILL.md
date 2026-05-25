---
name: ai-feature-patterns
description: Build Anthropic-backed AI features with streaming UX, prompt discipline, and cost controls. Use when implementing or reviewing features after the ai-anthropic pack is installed.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Skill: ai-feature-patterns

## Goal

Add one focused AI capability that helps the product journey without turning the
MVP into a generic chat app. Keep prompts inspectable, streams responsive, and
cost bounded by server-side controls.

## Recommended model

Opus 4.7 or GPT-5.5 for prompt architecture and evaluation. Sonnet 4.6 or GPT-5
family executor for endpoint, UI, and test wiring.

## Inputs

Read these before changing AI behavior:

- `docs/spark/project.md` for the user workflow and non-goals
- The active change's `docs/spark/changes/<id>-YYYY-MM-DD/design.md` for persistence, auth, and runtime boundaries
- The active change's `docs/spark/changes/<id>-YYYY-MM-DD/tasks.md` for the exact AI task and acceptance criteria
- `lib/anthropic.ts` for shared client setup
- `app/api/ai/route.ts` for request, stream, and guardrail behavior

If the spec does not name the decision or artifact the AI should improve, stop
and ask. Do not add chat just because an AI SDK is installed.

## Prompt Patterns

- Put durable behavior in a server-owned system prompt.
- Put user-specific state in structured context, not prose pasted from the UI.
- Keep task prompts narrow: role, input facts, output format, refusal boundary.
- Prefer JSON or Markdown output contracts only when the UI actually needs them.
- Do not ask the model to enforce authorization, billing, or data access rules.
- Include the smallest useful context window; retrieve or summarize before
  sending long histories.

## Streaming UX

- Stream text when the user is waiting on generation or analysis.
- Show partial output in the destination surface, not a separate debug pane.
- Preserve a cancel path when requests can take more than a few seconds.
- Persist the final answer only after the stream completes successfully.
- Treat stream errors as recoverable UI state with a retry action.

## Cost Controls

- Cap `max_tokens` on the server, even when the client sends a smaller hint.
- Rate limit by user, organization, or IP before calling Anthropic.
- Add a cheap preflight check for empty prompts and unsupported file sizes.
- Log model, token caps, latency, and user/account id for cost review.
- Use smaller models or cached summaries for low-stakes transformations.
- Keep generated artifacts small enough to review and edit.

## Safety and Privacy

- Send only the data needed for the requested feature.
- Redact secrets and credentials from context before model calls.
- Avoid storing raw prompts if they may contain sensitive customer data.
- Make model output advisory unless the product spec explicitly automates action.
- Require human confirmation before sending emails, charging users, or deleting data.

## Common Pitfalls

- Do not stream from the browser directly with the API key.
- Do not let the client choose unlimited tokens or arbitrary expensive models.
- Do not hide prompt changes in component code; keep prompts close to API routes.
- Do not make acceptance criteria depend on subjective model quality alone.
- Do not add vector search, agents, or tool calls unless the board asks for them.

## Verification

Use a small real prompt and confirm all of these:

- The endpoint streams incremental `text` events.
- The final event is `done`.
- Invalid input returns a 400 before calling Anthropic.
- Token caps and rate limits are enforced server-side.
