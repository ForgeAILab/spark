> **Update — 2026-05-21:** This research informed the decision to build a custom scaffold+pack-registry rather than fork an existing template. The recommended migration path is now `bunx create-spark <name> --template nextjs --preset <preset>` (see repo `README.md`), not forking `KolbySisk/next-supabase-stripe-starter`. The pack catalog ships under `packs/` and covers `db-supabase`, `auth-supabase`, `auth-better-auth`, `payments-stripe`, `ui-shadcn`, `email-resend`, `ai-anthropic`, `ai-openai`, `analytics-posthog`, `sync-zero`, and more. Presets like `saas-classic`, `lean-saas`, `local-ai-mvp`, and `internal-tool` compose those packs into common stacks. The research below is preserved for context.

---

# Open Source Building Blocks for a Board-Driven AI MVP Pipeline

## Executive summary

The strongest **strict-stack** path for your use case is to start from an open Next.js + Supabase + Stripe starter, then layer a **shared board contract** on top with `AGENTS.md`, `CLAUDE.md`, `.ai/board.md`, and reusable `SKILL.md` workflows. Among the open repositories reviewed, `KolbySisk/next-supabase-stripe-starter` is the closest fit to your desired product stack and execution style, while `nextjs/saas-starter` is the cleanest current official baseline if you are willing to use Postgres/Drizzle instead of Supabase. Vercel's older Supabase + Stripe starter remains useful as a reference, but it is explicitly marked as sunset and replaced by `nextjs/saas-starter`. citeturn7view2turn13view0turn14view0

