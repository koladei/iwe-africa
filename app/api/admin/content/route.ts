import { prisma } from "@/lib/prisma";
import { lessonInput } from "@/lib/content";
import { privileges, requirePrivilege } from "@/lib/authorization";

export async function GET() {
  const access = await requirePrivilege(privileges.CONTENT_READ);
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const [lessons, topics] = await Promise.all([
    prisma.lesson.findMany({ include: { topic: true, questions: { include: { options: true }, orderBy: { order: "asc" } }, createdBy: { select: { name: true, email: true } }, revisionOf: { select: { id: true, title: true, slug: true } } }, orderBy: [{ status: "asc" }, { updatedAt: "desc" }] }),
    prisma.topic.findMany({ orderBy: { title: "asc" } }),
  ]);
  return Response.json({ lessons, topics });
}

export async function POST(request: Request) {
  const access = await requirePrivilege(privileges.CONTENT_CREATE);
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const parsed = lessonInput.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid lesson draft", details: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;
  const topic = await prisma.topic.findUnique({ where: { id: data.topicId } });
  if (!topic) return Response.json({ error: "Unknown topic" }, { status: 400 });
  try {
    const lesson = await prisma.lesson.create({
      data: {
        ...data, audioUrl: data.audioUrl ?? null, createdById: access.user.id,
        questions: { create: data.questions.map((question, questionIndex) => ({
          prompt: question.prompt, explanation: question.explanation, order: questionIndex + 1,
          options: { create: question.options.map((item, optionIndex) => ({ label: item.label, isCorrect: item.isCorrect, order: optionIndex + 1 })) },
        })) },
      },
      include: { topic: true },
    });
    return Response.json({ lesson }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return Response.json({ error: "A lesson already uses that slug." }, { status: 409 });
    throw error;
  }
}
