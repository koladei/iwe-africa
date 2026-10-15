import { prisma } from "@/lib/prisma";
import { privileges, requirePrivilege } from "@/lib/authorization";

export async function POST(_request: Request, context: { params: Promise<{ lessonId: string }> }) {
  const access = await requirePrivilege(privileges.CONTENT_ARCHIVE);
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const { lessonId } = await context.params;
  const lesson = await prisma.lesson.update({ where: { id: lessonId }, data: { status: "ARCHIVED", archivedById: access.user.id, archivedAt: new Date() } }).catch(() => null);
  if (!lesson) return Response.json({ error: "Lesson not found" }, { status: 404 });
  return Response.json({ lesson });
}
