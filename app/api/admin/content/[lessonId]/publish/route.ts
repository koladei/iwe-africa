import { prisma } from "@/lib/prisma";
import { privileges, requirePrivilege } from "@/lib/authorization";

export async function POST(_request: Request, context: { params: Promise<{ lessonId: string }> }) {
  const access = await requirePrivilege(privileges.CONTENT_PUBLISH);
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const { lessonId } = await context.params;
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { questions: true } });
  if (!lesson) return Response.json({ error: "Lesson not found" }, { status: 404 });
  if (lesson.status !== "DRAFT" || lesson.questions.length !== 3) return Response.json({ error: "Only a complete draft with three questions can be published." }, { status: 409 });
  const published = await prisma.$transaction(async (tx) => {
    if (lesson.revisionOfId) await tx.lesson.update({ where: { id: lesson.revisionOfId }, data: { status: "ARCHIVED", archivedById: access.user.id, archivedAt: new Date() } });
    return tx.lesson.update({ where: { id: lesson.id }, data: { status: "PUBLISHED", publishedById: access.user.id, publishedAt: new Date() } });
  });
  return Response.json({ lesson: published });
}
