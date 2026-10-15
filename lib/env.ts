const requiredForProduction = ["DATABASE_URL", "BETTER_AUTH_SECRET", "APP_URL"] as const;

export function environmentStatus() {
  const missing = requiredForProduction.filter((name) => !process.env[name]);
  return {
    ok: missing.length === 0,
    missing,
    channels: {
      telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      whatsapp: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
      openai: Boolean(process.env.OPENAI_API_KEY),
    },
  };
}
