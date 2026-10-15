import { prisma } from "@/lib/prisma";
import { privileges, requirePrivilege } from "@/lib/authorization";

export async function POST(_request: Request, context: { params: Promise<{ lessonId: string }> }) {
  const access = await requirePrivilege(privileges.CONTENT_UPDATE);
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const { lessonId } = await context.params;
  const source = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { questions: { include: { options: true }, orderBy: { order: "asc" } } } });
  if (!source) return Response.json({ error: "Lesson not found" }, { status: 404 });
  if (source.status !== "PUBLISHED") return Response.json({ error: "Only a published lesson can be revised." }, { status: 409 });
  const existingRevision = await prisma.lesson.findFirst({ where: { revisionOfId: source.id, status: "DRAFT" } });
  if (existingRevision) return Response.json({ lesson: existingRevision, existing: true });
  const lesson = await prisma.lesson.create({
    data: {
      slug: `${source.slug}-revision-${Date.now()}`, topicId: source.topicId, title: source.title,
      conceptBite: source.conceptBite, sourceTitle: source.sourceTitle, sourceUrl: source.sourceUrl,
      audioUrl: source.audioUrl, order: source.order, revisionOfId: source.id, createdById: access.user.id,
      questions: { create: source.questions.map((question) => ({
        prompt: question.prompt, explanation: question.explanation, order: question.order,
        options: { create: question.options.map((option) => ({ label: option.label, isCorrect: option.isCorrect, order: option.order })) },
      })) },
    },
  });
  return Response.json({ lesson }, { status: 201 });
}
