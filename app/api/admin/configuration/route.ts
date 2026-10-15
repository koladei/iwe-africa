import { z } from "zod";
import { configurationStatus, isConfigurationKey, setConfiguration } from "@/lib/configuration";
import { privileges, requirePrivilege } from "@/lib/authorization";

const input = z.object({ key: z.string(), value: z.string().min(1).max(10_000) });

export async function GET() {
  const access = await requirePrivilege(privileges.CONFIGURATION_READ);
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  return Response.json({ settings: await configurationStatus() });
}

export async function PUT(request: Request) {
  const access = await requirePrivilege(privileges.CONFIGURATION_UPDATE);
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid configuration value" }, { status: 400 });
  const key = parsed.data.key;
  if (!isConfigurationKey(key)) return Response.json({ error: "Unknown configuration key" }, { status: 400 });
  await setConfiguration(key, parsed.data.value);
  return Response.json({ key, configured: true });
}
