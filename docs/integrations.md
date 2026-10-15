# Messaging and AI integration guide

## Telegram

Store and rotate every provider value through the protected administrator configuration portal. Provider values are encrypted in PostgreSQL and are never kept in `.env`, source control, or screenshots.

1. Create a bot through BotFather and store its token as `TELEGRAM_BOT_TOKEN` in **Admin → Settings → Telegram**.
2. Generate a random `TELEGRAM_WEBHOOK_SECRET` and store it in the same panel.
3. Configure `https://iwe.cradlesoft.tech/api/webhooks/telegram` as the webhook and supply the same secret token.
4. Send `/start` to verify that Iwe returns the daily lesson bite.

The webhook validates `x-telegram-bot-api-secret-token` when a secret is configured. Do not accept webhook traffic without a secret in production.

## WhatsApp Cloud API

1. Store `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, and `WHATSAPP_APP_SECRET` in **Admin → Settings → WhatsApp**.
2. In Meta, subscribe the WhatsApp app to `https://iwe.cradlesoft.tech/api/webhooks/whatsapp`.
3. Complete Meta's GET webhook verification using `WHATSAPP_VERIFY_TOKEN`.
4. Subscribe to inbound message events and test with `learn`.
5. Create and approve a reminder template; store its exact name as `WHATSAPP_REMINDER_TEMPLATE`.

The POST handler verifies `x-hub-signature-256` against the raw request body. Scheduled reminders use the approved template when configured; ordinary inbound learning replies use text messages.

## OpenAI explanations

The explanation endpoint sends only the current lesson, question, answer rationale, and source title. It never needs learner names, channel identifiers, or conversation history. Store `OPENAI_API_KEY` and, optionally, `OPENAI_MODEL` in **Admin → Settings → OpenAI**. If the API is unavailable or not configured, the app serves the curated explanation instead.

## Test safely

- Use a private Telegram test chat and a Meta test number.
- Keep tokens in the encrypted administrator configuration portal, never in source, `.env`, or screenshots.
- Test webhook verification before changing production webhook settings.
- Inspect `/api/health` after deployment; it reports missing configuration names but never secret values.
