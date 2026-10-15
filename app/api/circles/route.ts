import crypto from "node:crypto";
import { z } from "zod";
import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const circleInput = z.object({ name: z.string().trim().min(2).max(60) });

async function learnerForCurrentUser() {
  const user = await currentUser();
  if (!user) return null;
  return prisma.learner.findUnique({ where: { userId: user.id } });
}

export async function GET() {
  const learner = await learnerForCurrentUser();
  if (!learner) return Response.json({ error: "Complete onboarding first" }, { status: 401 });
  const memberships = await prisma.circleMembership.findMany({ where: { learnerId: learner.id }, include: { circle: { include: { memberships: { include: { learner: { select: { displayName: true } } } } } } } });
  return Response.json({ circles: memberships.map(({ circle }) => ({ id: circle.id, name: circle.name, members: circle.memberships.map((member) => ({ displayName: member.learner.displayName })) })) });
}

export async function POST(request: Request) {
  const learner = await learnerForCurrentUser();
  if (!learner) return Response.json({ error: "Complete onboarding first" }, { status: 401 });
  const parsed = circleInput.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "A circle name must be 2–60 characters." }, { status: 400 });
  const token = crypto.randomBytes(18).toString("base64url");
  const circle = await prisma.circle.create({ data: { name: parsed.data.name, memberships: { create: { learnerId: learner.id } }, invites: { create: { creatorId: learner.id, token, expiresAt: new Date(Date.now() + 7 * 86_400_000), maxUses: 3 } } }, include: { invites: true } });
  return Response.json({ circle: { id: circle.id, name: circle.name }, inviteUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/join/${circle.invites[0].token}` }, { status: 201 });
}
