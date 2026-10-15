# Iwe

Iwe is a low-data, messaging-first WAEC Mathematics learning companion for learners aged 13 and above. It combines short, cited lesson bites, quick practice, private accountability circles, and chat-channel delivery to make a daily study habit easier to sustain.

**Current channels:** Telegram is ready for live configuration. WhatsApp Cloud API is implemented and awaits Meta credentials/approval.

## What is included

- 12 curated WAEC Mathematics lessons and 36 multiple-choice check-in questions.
- Email/password accounts, 13+ confirmation, and protected onboarding/progress APIs.
- A responsive learner dashboard with progress, audio playback, reminders, and a private-circle demo.
- Private-circle APIs with expiring, limited-use invitation links.
- Telegram and WhatsApp webhooks, an OpenAI explanation fallback, a reminder worker, and Docker deployment files.

Read [docs/architecture.md](docs/architecture.md) for data-flow boundaries, [docs/integrations.md](docs/integrations.md) for channel setup, and [docs/content.md](docs/content.md) before extending lessons.

## Local setup

### Prerequisites

- Node.js 22 or later
- npm
- PostgreSQL 16 or later, either already running locally or through Docker

### 1. Configure environment

```sh
cp .env.example .env
```

Set `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `APP_URL`. For local development, `BETTER_AUTH_URL` and `APP_URL` should match the URL printed by `npm run dev`—for example, `http://localhost:3000`.

Create a secure secret with `openssl rand -base64 32`.

### 2. Start a database

Use an existing PostgreSQL database, or start the bundled one:

```sh
docker compose up -d postgres
```

For the bundled database, use a local `DATABASE_URL` such as:

```text
postgresql://iwe:your-postgres-password@localhost:5432/iwe?schema=public
```

`POSTGRES_PASSWORD` in `.env` must match `your-postgres-password`.

### 3. Install, create tables, and seed lesson data

```sh
npm install
npm run db:push
npm run db:seed
```

`db:push` is intentionally used for this competition prototype. Use versioned migrations before treating the deployment as long-lived production infrastructure.

### 4. Run the application

```sh
npm run dev
```

Open the printed local URL. Use `/dashboard` for the interactive visual demo, or `/sign-up` to create an account and visit the protected `/app` route.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js in development mode. |
| `npm run build` | Create a production build. |
| `npm run test` | Run unit tests. |
| `npm run db:push` | Synchronize PostgreSQL with Prisma schema. |
| `npm run db:seed` | Add the 12 Iwe lesson bites and questions. |
| `npm run worker` | Run one reminder-worker pass. |

## Configure chat channels

No real chat message is sent until the relevant environment values are present.

- **Telegram:** set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET`, then register `https://your-domain/api/webhooks/telegram` as the bot webhook with the same secret token. `/start`, `/learn`, and `/progress` are supported.
- **WhatsApp:** set `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, and `WHATSAPP_APP_SECRET`. Subscribe Meta to `https://your-domain/api/webhooks/whatsapp`. Set `WHATSAPP_REMINDER_TEMPLATE` to an approved template name for scheduled reminders.
- **OpenAI:** optionally set `OPENAI_API_KEY` and `OPENAI_MODEL`. Without them, Iwe returns the source-grounded curated explanation.

See [docs/integrations.md](docs/integrations.md) for the webhook checklist and safe test procedure.

## Deploy to the VPS

1. Point the `A` record for `iwe.cradlesoft.tech` to the VPS; allow inbound ports 80 and 443.
2. Copy `.env.example` to `.env` on the VPS. Set strong production values, `APP_URL=https://iwe.cradlesoft.tech`, and `BETTER_AUTH_URL=https://iwe.cradlesoft.tech`.
3. Start the stack and initialize data:

   ```sh
   docker compose up -d --build
   docker compose exec app npx prisma db push
   docker compose exec app npm run db:seed
   ```

4. Check `https://iwe.cradlesoft.tech/api/health`, then configure Telegram and WhatsApp webhooks.

Caddy receives public HTTPS traffic, automatically manages certificates, and forwards it to the Next.js app. PostgreSQL and the reminder worker remain private Docker services.

## Privacy and safety

Iwe is designed for learners 13+. It stores only functional account, channel, reminder, and learning-progress data. It does not provide public learner search, direct messaging, rankings, or public scores. Circle members can see only a display name and completion status.

Do not add unrestricted learner-to-learner chat, public profiles, random matching, personal-data collection, or unverified content without revisiting the safeguarding model in [docs/architecture.md](docs/architecture.md).

## Backups and operations

Back up the database regularly from the VPS:

```sh
docker compose exec -T postgres pg_dump -U iwe iwe > iwe-backup.sql
```

Store encrypted backups outside the VPS. Never commit `.env`, access tokens, database dumps, or webhook payloads containing learner data.
