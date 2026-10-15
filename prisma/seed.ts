import { PrismaClient } from "@prisma/client";
import { seedLessons } from "../lib/lessons";

const prisma = new PrismaClient();

async function main() {
  for (const [index, lesson] of seedLessons.entries()) {
    const topic = await prisma.topic.upsert({
      where: { slug: lesson.topic.toLowerCase() },
      update: {},
      create: { slug: lesson.topic.toLowerCase(), title: lesson.topic, description: `${lesson.topic} foundations for WAEC Mathematics.` },
    });
    await prisma.lesson.upsert({
      where: { slug: lesson.slug },
      update: {},
      create: {
        slug: lesson.slug, topicId: topic.id, title: lesson.title, conceptBite: lesson.bite,
        sourceTitle: lesson.sourceTitle, sourceUrl: lesson.sourceUrl, order: index + 1,
        questions: { create: lesson.questions.map((question, questionIndex) => ({
          prompt: question.prompt, explanation: question.explanation, order: questionIndex + 1,
          options: { create: question.options.map((option, optionIndex) => ({ label: option.label, isCorrect: option.correct, order: optionIndex + 1 })) },
        })) },
      },
    });
  }
}

main().finally(() => prisma.$disconnect());
