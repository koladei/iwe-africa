# Iwe product specification

**Version:** Competition MVP  
**Audience:** WAEC Mathematics learners aged 13+  
**Primary deployment:** `iwe.cradlesoft.tech`

## 1. Purpose

Iwe is a low-data learning companion that helps learners sustain independent study through the messaging apps and devices they already use. The competition MVP focuses on WAEC Mathematics and demonstrates one complete daily learning loop:

1. Receive a short, syllabus-aligned lesson bite.
2. Read or listen to the explanation.
3. Answer three multiple-choice questions.
4. Receive immediate, source-grounded feedback.
5. Maintain a private study rhythm through reminders and an invite-only peer circle.

The solution addresses both access/discovery and sustained engagement. It intentionally avoids a heavy video-first portal or an unrestricted general chatbot.

## 2. Users and goals

| User | Goal | Iwe response |
| --- | --- | --- |
| Learner (13+) | Study a relevant topic with little data and little time. | Text-first five-minute lesson bites, optional audio, and short quizzes. |
| Learner in a study circle | Stay accountable without exposing performance. | Private invite-only circles that show only display name and completion state. |
| Competition reviewer | See a credible, locally relevant proof of concept. | A web demo, verified curriculum references, messaging integration readiness, and an observable daily loop. |
| Iwe staff member | Manage only the operational work assigned to them. | Privilege-based access, reusable roles, direct grants, and an audited administration portal. |

## 3. Functional requirements

### Learning experience

- Provide 12 original WAEC Mathematics lesson bites across Number, Algebra, Geometry, and Statistics.
- Keep each Concept Bite below 150 words and attach a credible source title and URL.
- Provide exactly three multiple-choice questions per lesson with one correct answer and a teaching explanation.
- Offer optional audio playback; never require audio to complete a lesson.
- Display progress, completed lessons, and a daily streak.
- Default learner reminders to 6:00 PM Africa/Lagos; let learners choose a reminder time and timezone.

### Identity and safety

- Support email/password accounts through Better Auth.
- Require learners to confirm that they are aged 13 or over before creating an Iwe learner profile.
- Store only functional identity, channel, preference, and learning-progress data.
- Do not implement public profiles, public search, direct learner-to-learner messaging, rankings, random matching, or public score sharing.

### Peer circles

- Let an authenticated learner create a private circle.
- Create an expiring, limited-use invite token for each new circle.
- Require explicit sign-in and joining consent from invite recipients.
- Limit circle visibility to display names and daily completion state. Answers, scores, streaks, channel identifiers, and detailed history remain private.

### Messaging channels

- Support Telegram `/start`, `/learn`, and `/progress` interactions through a verified webhook.
- Support WhatsApp webhook verification, signature verification, and inbound `learn` requests.
- Use approved WhatsApp templates for scheduled reminders when a template name is configured.
- Keep Telegram and WhatsApp behavior behind a channel-neutral provider interface.
- Continue to make the web dashboard useful if no provider credential is configured.

### AI explanations

- Provide an optional “explain differently” service using only the active Concept Bite, question, rationale, and source metadata.
- Require concise, age-appropriate, source-grounded output.
- Never send learner identity, channel identifiers, or unrelated history to the model.
- Fall back to the curated explanation when OpenAI is not configured, returns an error, or is rate-limited.

### Configuration and operations

- Persist provider configuration in encrypted PostgreSQL records.
- Cache encrypted configuration snapshots in Redis when `REDIS_URL` is configured.
- Never expose stored secret values in browser responses, logs, health checks, or documentation.
- Allow authorized staff to view configured/not-configured state and replace a configuration value through `/api/admin/configuration`.
- Support Docker Compose deployment with Next.js, PostgreSQL, Redis, a reminder worker, and Caddy.

### Administration and authorization

- Use a code-defined privilege catalogue. Privileges are positive grants only; there are no explicit deny rules.
- Resolve effective user access as the unique union of privileges inherited through every assigned role and directly assigned user privileges.
- Seed protected built-in roles: Platform Administrator, Content Editor, and Access Administrator. Authorized staff may create custom roles from supported privileges.
- Use `CONFIG_ADMIN_EMAILS` only to bootstrap matching existing accounts into the Platform Administrator role. It never removes existing role memberships.
- Require a specific server-side privilege for every administration API or server action. Browser navigation is not authorization.
- Keep an authorization audit trail containing only the actor, action, affected role/user identifier, subject identifier, and timestamp. Never log provider values, learner progress, quiz data, or secrets.
- Preserve at least one user with role-assignment access. Built-in roles are protected from alteration or deletion.

## 4. Non-functional requirements

| Area | Requirement |
| --- | --- |
| Low bandwidth | Learning content is concise and text-first; provider payloads remain small. |
| Credibility | Every lesson is original, source-attributed, and curriculum-aligned. |
| Privacy | Secrets are encrypted at rest; learner data is minimized and private by default. |
| Resilience | Curated lessons work without OpenAI, Redis, Telegram, or WhatsApp credentials. |
| Accessibility | The web interface is responsive, keyboard-operable, readable, and does not depend on audio. |
| Deployment | Production traffic terminates TLS at Caddy on `iwe.cradlesoft.tech`. |

## 5. Architecture

```text
Learner browser ──────┐
Telegram / WhatsApp ──┼── Next.js ── Prisma ── PostgreSQL
                      │      │
                      │      ├── Redis encrypted configuration cache
                      │      └── OpenAI Responses API (optional)
                      │
Reminder worker ──────┴── MessagingProvider

Caddy ─────────────── HTTPS ingress and reverse proxy
```

Provider values are bootstrapped from environment variables once, then retrieved from encrypted database settings. `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `CONFIG_ENCRYPTION_KEY` remain deployment-level environment variables.

`npm run authorization:bootstrap` seeds the privilege catalogue and promotes configured bootstrap email accounts. The protected `/api/admin/configuration` endpoint requires configuration privileges and returns only configured/not-configured state.

## 6. MVP scope and exclusions

Included in this MVP:

- Web dashboard and public interactive demo.
- Authenticated learner route and protected APIs.
- Seed curriculum content and persistence schema.
- Telegram and WhatsApp integration endpoints.
- OpenAI fallback architecture.
- Private-circle API and invitation flow.
- Integrated `/admin` portal for content, encrypted provider-setting status/replacement, custom roles, memberships, and direct privilege grants.

Explicitly excluded for now:

- WhatsApp group automation.
- Voice-note transcription and AI audio replies.
- Automated curriculum/past-paper ingestion.
- Full curriculum coverage beyond the 12 seed lessons.
- Public communities, rankings, direct messages, or random peer matching.
- Guardian consent, teacher dashboards, or institutional administration workflows.

## 7. Acceptance criteria

The MVP is ready for a competition demonstration when:

1. A new user can create an account, confirm 13+, and access the protected learner route.
2. A learner can complete a seeded lesson’s three-question check-in in the dashboard.
3. The lesson displays its source and remains usable when OpenAI is unavailable.
4. A learner can create a circle and obtain an invitation URL without exposing scores or answers.
5. The Telegram webhook can return a daily bite to a test chat after provider configuration is stored.
6. The WhatsApp webhook passes Meta verification and validates signed test payloads after approval/configuration.
7. Provider secrets are encrypted in PostgreSQL and the encrypted snapshot is cached in Redis.
8. Access is the unique union of role and direct privilege grants; users without a required privilege cannot call the protected API.
9. `npm run test` and `npm run build` pass.

## 8. Deferred work

- Wire the dashboard’s current local demo state to the protected persistence APIs.
- Add provider-specific integration tests using safe fixtures.
- Add migration history before a long-lived production rollout.
- Add multilingual content, carefully curated local-language translations, and non-audio accessibility improvements.
