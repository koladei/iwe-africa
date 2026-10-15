import { configurationStatus } from "@/lib/configuration";

const requiredForProduction = ["DATABASE_URL", "BETTER_AUTH_SECRET", "APP_URL", "CONFIG_ENCRYPTION_KEY"] as const;

export async function environmentStatus() {
  const missing = requiredForProduction.filter((name) => !process.env[name]);
  const settings = await configurationStatus().catch(() => null);
  return {
    ok: missing.length === 0,
    missing,
    redis: Boolean(process.env.REDIS_URL),
    settings,
  };
}
