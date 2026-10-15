import { environmentStatus } from "@/lib/env";

export const dynamic = "force-dynamic";
export async function GET() {
  const status = environmentStatus();
  return Response.json(status, { status: status.ok ? 200 : 503 });
}
