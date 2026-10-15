import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

async function activeInvite(token: string) {
  const invite = await prisma.circleInvite.findUnique({ where: { token }, include: { circle: true } });
  if (!invite || invite.expiresAt < new Date() || invite.uses >= invite.maxUses) return null;
  return invite;
}

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const invite = await activeInvite((await params).token);
  if (!invite) return Response.json({ error: "This invitation has expired or is no longer available." }, { status: 404 });
  return Response.json({ circle: { name: invite.circle.name }, expiresAt: invite.expiresAt });
}

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in required before joining a circle." }, { status: 401 });
  const learner = await prisma.learner.findUnique({ where: { userId: user.id } });
  if (!learner) return Response.json({ error: "Complete onboarding first" }, { status: 409 });
  const invite = await activeInvite((await params).token);
  if (!invite) return Response.json({ error: "This invitation has expired or is no longer available." }, { status: 404 });
  await prisma.$transaction(async (transaction) => {
    const joined = await transaction.circleMembership.upsert({ where: { circleId_learnerId: { circleId: invite.circleId, learnerId: learner.id } }, update: {}, create: { circleId: invite.circleId, learnerId: learner.id } });
    if (joined.joinedAt.getTime() > Date.now() - 5_000) await transaction.circleInvite.update({ where: { id: invite.id }, data: { uses: { increment: 1 } } });
  });
  return Response.json({ joined: true });
}
