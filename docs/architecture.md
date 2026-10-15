# Iwe architecture and product boundaries

## Runtime map

```text
Browser ──────────────┐
Telegram webhook ─────┼── Next.js app ── Prisma ── PostgreSQL
WhatsApp webhook ─────┘       │                 │
                              │                 └── encrypted provider settings
                              ├── Redis (encrypted settings cache)
                              └── OpenAI Responses API (optional)

Reminder worker ────────────── MessagingProvider ── Telegram / WhatsApp
Caddy ──────────────────────── HTTPS reverse proxy on the VPS
```

## Important routes

| Route | Role |
| --- | --- |
| `/dashboard` | Public visual demo that uses browser-local state. Do not treat its actions as persisted learner records. |
| `/sign-up`, `/sign-in` | Better Auth email/password entry points. |
| `/app` | Authenticated learner area. |
| `/api/onboarding`, `/api/progress` | Protected learner-profile and progress APIs. |
| `/api/circles`, `/api/invites/[token]` | Private-circle creation and consent-based joining. |
| `/api/webhooks/*` | Provider callbacks; never expose them without the documented verification checks. |

## Data rules

`User`, `Session`, `Account`, and `Verification` are Better Auth models. `Learner` holds Iwe-specific settings and is linked one-to-one with `User`. Lesson and assessment models are separate from identity data. A channel account is linked through `ChannelIdentity`, never by using a phone number as the application user ID.

All circle views must expose only display names and daily completion state. Quiz answers, scores, full lesson history, and contact/channel identifiers are private.

## Provider configuration

`ApplicationSetting` stores OpenAI, Telegram, and WhatsApp values encrypted with `CONFIG_ENCRYPTION_KEY`; Redis caches the encrypted database snapshot for five minutes. The application decrypts values only in server memory immediately before an outbound provider call or webhook verification. The browser and health endpoint never receive secret values.

Initial values are copied with `npm run configuration:bootstrap`. Existing stored values win over environment values. `CONFIG_ADMIN_EMAILS` is only a one-way bootstrap allowlist for the Platform Administrator role; `/api/admin/configuration` is protected by the configuration privileges defined in `lib/authorization.ts` and returns only configured/not-configured state.

## Staff authorization

`Privilege` is a reviewed application catalogue. `RolePrivilege`, `UserRole`, and `UserPrivilege` model assignment history, including the grantor and time. Effective access is a set union of role and direct grants. The `/admin` portal allows authorized staff to create custom roles from catalogue privileges and manage assignments. `AuthorizationAudit` records operational authorization changes without secrets or learner learning data.

## Product safeguards

- Require a 13+ confirmation before creating a learner profile.
- Do not collect a date of birth, school name, address, precise location, or sensitive personal information.
- Keep lessons source-attributed and concise; source material is context, not text to copy wholesale.
- Keep AI output bounded to the current verified lesson and answer rationale. Always retain the curated fallback.
- Preserve the distinction between the present demo dashboard and authenticated persisted behavior when extending the application.
