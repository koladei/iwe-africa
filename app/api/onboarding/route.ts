import { z } from "zod";
import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const onboarding = z.object({ displayName: z.string().trim().min(2).max(40), ageConfirmed: z.literal(true), timezone: z.string().min(1).max(80).default("Africa/Lagos"), reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default("18:00") });

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const body = onboarding.safeParse(await request.json());
  if (!body.success) return Response.json({ error: "Please confirm that you are at least 13 and check your settings." }, { status: 400 });
  const learner = await prisma.learner.upsert({ where: { userId: user.id }, update: { displayName: body.data.displayName, timezone: body.data.timezone, reminderTime: body.data.reminderTime }, create: { userId: user.id, displayName: body.data.displayName, ageConfirmedAt: new Date(), timezone: body.data.timezone, reminderTime: body.data.reminderTime } });
  return Response.json({ learner });
}
