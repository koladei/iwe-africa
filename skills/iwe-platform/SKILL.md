---
name: iwe-platform
description: Build or modify Iwe's Next.js, Prisma, dashboard, authentication, lesson, circle, and deployment features while preserving its teen-safe learning model.
---

# Iwe Platform

Use this skill for Iwe product, dashboard, database, authentication, curriculum, circle, worker, or Docker/Caddy changes. Do not use it for a provider-only webhook task; use `iwe-messaging` instead.

## Project map

- Review `docs/architecture.md` before changing identity, persistence, learner visibility, or routing.
- Review `docs/content.md` before changing seed lessons or adding curriculum content.
- `app/dashboard` is a public, browser-local demo. `/app` is the authenticated learner route. Do not represent demo-only UI state as persisted progress.
- Better Auth owns `User`, `Session`, `Account`, and `Verification`; Iwe-specific learner data belongs under `Learner` and related Prisma models.
- Provider settings belong in encrypted `ApplicationSetting` records and are cached through `lib/configuration.ts`; keep `DATABASE_URL`, authentication secrets, and the configuration encryption key as deployment-only environment variables.
- Staff access is resolved by `lib/authorization.ts` from all role memberships plus direct grants. Use a specific privilege check for every protected action; `CONFIG_ADMIN_EMAILS` only bootstraps the Platform Administrator role.

## Product invariants

- Serve learners aged 13+ with minimal data. Never add public learner discovery, direct learner messaging, rankings, random matching, or exposed scores without explicit user authorization.
- Circle views may show display names and daily completion state only. Keep answers, scores, channel IDs, and lesson histories private.
- Lessons must be concise, source-attributed, original, text-first, and usable without an LLM.
- AI output must remain bounded to verified current lesson context and retain a curated fallback.

## Change workflow

1. Use current Next.js/Prisma/Better Auth documentation before library-specific changes.
2. Update the Prisma schema and seed data together when changing persisted learning content or relationships.
3. Run `npx prisma generate`, relevant tests, and `npm run build` after database or route changes. Apply `npm run db:push` only when database mutation is authorized.
4. When provider configuration changes, update `docs/integrations.md` and preserve the bootstrap-only role of provider environment variables.
5. Keep `README.md` and the relevant `docs/` guide current when setup, architecture, or behavior changes.
6. When changing staff access, update the application-defined privilege catalogue and its tests together. Never log secrets or learner data in authorization audits.
