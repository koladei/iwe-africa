import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { Dashboard } from "@/components/dashboard";
import { prisma } from "@/lib/prisma";

export default async function LearnerApp() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const lessons = await prisma.lesson.findMany({ where: { status: "PUBLISHED" }, include: { topic: true, questions: { include: { options: true }, orderBy: { order: "asc" } } }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  return <Dashboard lessons={lessons.map((lesson) => ({ slug: lesson.slug, topic: lesson.topic.title, title: lesson.title, bite: lesson.conceptBite, sourceTitle: lesson.sourceTitle, sourceUrl: lesson.sourceUrl, questions: lesson.questions.map((question) => ({ prompt: question.prompt, explanation: question.explanation, options: question.options.sort((a, b) => a.order - b.order).map((option) => ({ label: option.label, correct: option.isCorrect })) })) }))} />;
}
