import { z } from "zod";
import { currentUser } from "@/lib/session";
import { configurationStatus, isConfigurationKey, setConfiguration } from "@/lib/configuration";

const input = z.object({ key: z.string(), value: z.string().min(1).max(10_000) });

async function isAdministrator() {
  const user = await currentUser();
  const administrators = (process.env.CONFIG_ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  return Boolean(user && administrators.includes(user.email.toLowerCase()));
}

export async function GET() {
  if (!await isAdministrator()) return Response.json({ error: "Administrator access required" }, { status: 403 });
  return Response.json({ settings: await configurationStatus() });
}

export async function PUT(request: Request) {
  if (!await isAdministrator()) return Response.json({ error: "Administrator access required" }, { status: 403 });
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid configuration value" }, { status: 400 });
  const key = parsed.data.key;
  if (!isConfigurationKey(key)) return Response.json({ error: "Unknown configuration key" }, { status: 400 });
  await setConfiguration(key, parsed.data.value);
  return Response.json({ key, configured: true });
}
