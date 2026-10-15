# Iwe project guidance

Read the project documentation before making a related change:

- `README.md` for local setup, commands, deployment, and operations.
- `docs/architecture.md` for data boundaries and teen-safety constraints.
- `docs/integrations.md` for Telegram, WhatsApp, and OpenAI changes.
- `docs/content.md` for lesson and source quality.

Reusable project skills live in `skills/`:

- `skills/iwe-platform/SKILL.md` for product, database, dashboard, content, and deployment work.
- `skills/iwe-messaging/SKILL.md` for provider webhooks, reminders, and AI explanations.

Use the relevant skill whenever the task matches it. Preserve the 13+ privacy model and never commit `.env`, provider secrets, database dumps, or learner data.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
