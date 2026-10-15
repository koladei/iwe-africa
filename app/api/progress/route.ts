import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const learner = await prisma.learner.findUnique({ where: { userId: user.id }, include: { completions: { include: { lesson: true }, orderBy: { createdAt: "desc" } } } });
  return Response.json({ learner });
}
