import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export const configurationKeys = [
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_WEBHOOK_SECRET",
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_VERIFY_TOKEN",
  "WHATSAPP_APP_SECRET",
  "WHATSAPP_REMINDER_TEMPLATE",
] as const;

export type ConfigurationKey = (typeof configurationKeys)[number];
type SettingsMap = Partial<Record<ConfigurationKey, string>>;
const cacheKey = "iwe:configuration:v1";
const cacheTtlSeconds = 300;

function encryptionKey() {
  const value = process.env.CONFIG_ENCRYPTION_KEY;
  if (!value) throw new Error("CONFIG_ENCRYPTION_KEY must be configured to store provider settings.");
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) throw new Error("CONFIG_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  return key;
}

function encrypt(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

function decrypt(value: string) {
  const payload = Buffer.from(value, "base64");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

async function encryptedSnapshot(): Promise<Record<string, string>> {
  const cache = await redis();
  const cached = await cache?.get(cacheKey);
  if (cached) return JSON.parse(cached) as Record<string, string>;
  const settings = await prisma.applicationSetting.findMany();
  const snapshot = Object.fromEntries(settings.map((setting) => [setting.key, setting.ciphertext]));
  await cache?.set(cacheKey, JSON.stringify(snapshot), { EX: cacheTtlSeconds });
  return snapshot;
}

export async function getConfiguration(key: ConfigurationKey): Promise<string | undefined> {
  const snapshot = await encryptedSnapshot();
  return snapshot[key] ? decrypt(snapshot[key]) : undefined;
}

export async function configurationStatus() {
  const snapshot = await encryptedSnapshot();
  return Object.fromEntries(configurationKeys.map((key) => [key, Boolean(snapshot[key])])) as Record<ConfigurationKey, boolean>;
}

export async function setConfiguration(key: ConfigurationKey, value: string) {
  const ciphertext = encrypt(value);
  await prisma.applicationSetting.upsert({ where: { key }, update: { ciphertext }, create: { key, ciphertext } });
  const cache = await redis();
  await cache?.del(cacheKey);
}

export async function bootstrapConfigurationFromEnvironment() {
  for (const key of configurationKeys) {
    const value = process.env[key];
    if (!value) continue;
    const existing = await prisma.applicationSetting.findUnique({ where: { key } });
    if (!existing) await setConfiguration(key, value);
  }
}

export function isConfigurationKey(value: string): value is ConfigurationKey {
  return (configurationKeys as readonly string[]).includes(value);
}
