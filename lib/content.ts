import { z } from "zod";

const option = z.object({ label: z.string().trim().min(1).max(240), isCorrect: z.boolean() });
const question = z.object({ prompt: z.string().trim().min(4).max(500), explanation: z.string().trim().min(4).max(1_200), options: z.array(option).min(2).max(6) })
  .refine((item) => item.options.filter((candidate) => candidate.isCorrect).length === 1, "Each question needs exactly one correct option.");

export const lessonInput = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  topicId: z.string().min(1),
  title: z.string().trim().min(4).max(160),
  conceptBite: z.string().trim().min(20).max(1_400),
  sourceTitle: z.string().trim().min(3).max(200),
  sourceUrl: z.string().url().max(2_000),
  audioUrl: z.string().url().max(2_000).nullable().optional(),
  order: z.number().int().min(1).max(10_000),
  questions: z.array(question).length(3),
}).superRefine((value, context) => {
  if (value.conceptBite.split(/\s+/).filter(Boolean).length > 150) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["conceptBite"], message: "A Concept Bite must be 150 words or fewer." });
  }
});

export type LessonInput = z.infer<typeof lessonInput>;
