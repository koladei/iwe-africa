import { prisma } from "@/lib/prisma";
import { lessonInput } from "@/lib/content";
import { privileges, requirePrivilege } from "@/lib/authorization";

export async function PUT(request: Request, context: { params: Promise<{ lessonId: string }> }) {
  const access = await requirePrivilege(privileges.CONTENT_UPDATE);
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const { lessonId } = await context.params;
  const parsed = lessonInput.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid lesson draft", details: parsed.error.flatten() }, { status: 400 });
  const existing = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!existing) return Response.json({ error: "Lesson not found" }, { status: 404 });
  if (existing.status !== "DRAFT") return Response.json({ error: "Create a revision draft before editing a published or archived lesson." }, { status: 409 });
  const data = parsed.data;
  const lesson = await prisma.$transaction(async (tx) => {
    await tx.question.deleteMany({ where: { lessonId } });
    return tx.lesson.update({
      where: { id: lessonId },
      data: {
        ...data, audioUrl: data.audioUrl ?? null,
        questions: { create: data.questions.map((question, questionIndex) => ({
          prompt: question.prompt, explanation: question.explanation, order: questionIndex + 1,
          options: { create: question.options.map((item, optionIndex) => ({ label: item.label, isCorrect: item.isCorrect, order: optionIndex + 1 })) },
        })) },
      },
      include: { topic: true, questions: { include: { options: true }, orderBy: { order: "asc" } } },
    });
  });
  return Response.json({ lesson });
}
