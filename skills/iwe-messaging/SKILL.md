---
name: iwe-messaging
description: Implement or modify Iwe's Telegram, WhatsApp, reminder-worker, and bounded AI explanation integrations without weakening webhook security or learner privacy.
---

# Iwe Messaging

Use this skill for Telegram, WhatsApp Cloud API, message-provider adapters, reminder delivery, webhook endpoints, or OpenAI explanation work. Read `docs/integrations.md` first.

## Integration contract

- Keep provider-specific code behind the `MessagingProvider` interface in `lib/messaging.ts`. Preserve the same lesson/reminder semantics across channels.
- Telegram webhooks validate `x-telegram-bot-api-secret-token` when configured. WhatsApp POST requests validate the HMAC signature against the unparsed request body; GET handles Meta verification.
- Scheduled WhatsApp reminders use an approved template when `WHATSAPP_REMINDER_TEMPLATE` is configured. Do not assume arbitrary proactive messages are permitted.
- Messaging payloads are text-first and compact. Do not transmit quiz answers, scores, learner history, or other learner data to circle members.

## AI explanation contract

- Send only the active lesson, question, answer rationale, and source metadata to the model. Never send learner contact data or unrelated message history.
- Keep explanations concise, age-appropriate, source-grounded, and optional. On missing credentials, provider failure, or rate limits, return the curated explanation.

## Safe change workflow

1. Fetch current official provider or OpenAI documentation before changing protocol, API, webhook, or SDK behavior.
2. Do not register live webhooks, send a message, or modify a provider account without the user’s explicit authorization.
3. Use test chats/test numbers for manual checks. Keep tokens only in `.env` and do not put them in logs, tests, or documentation.
4. Verify malformed signatures are rejected and valid payloads parse correctly before deployment. Update `docs/integrations.md` when environment variables or provider behavior changes.
