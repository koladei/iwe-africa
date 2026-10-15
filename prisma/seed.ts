import { PrismaClient } from "@prisma/client";
import { seedLessons } from "../lib/lessons";
import { ensureAuthorizationCatalogue } from "../lib/authorization";

const prisma = new PrismaClient();

async function main() {
  await ensureAuthorizationCatalogue();
  for (const [index, lesson] of seedLessons.entries()) {
    const topic = await prisma.topic.upsert({
      where: { slug: lesson.topic.toLowerCase() },
      update: {},
      create: { slug: lesson.topic.toLowerCase(), title: lesson.topic, description: `${lesson.topic} foundations for WAEC Mathematics.` },
    });
    await prisma.lesson.upsert({
      where: { slug: lesson.slug },
      update: { status: "PUBLISHED", publishedAt: new Date() },
      create: {
        slug: lesson.slug, topicId: topic.id, title: lesson.title, conceptBite: lesson.bite,
        sourceTitle: lesson.sourceTitle, sourceUrl: lesson.sourceUrl, order: index + 1, status: "PUBLISHED", publishedAt: new Date(),
        questions: { create: lesson.questions.map((question, questionIndex) => ({
          prompt: question.prompt, explanation: question.explanation, order: questionIndex + 1,
          options: { create: question.options.map((option, optionIndex) => ({ label: option.label, isCorrect: option.correct, order: optionIndex + 1 })) },
        })) },
      },
    });
  }
}

main().finally(() => prisma.$disconnect());
