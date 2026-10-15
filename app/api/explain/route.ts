import { z } from "zod";
import { seedLessons } from "@/lib/lessons";
import { getConfiguration } from "@/lib/configuration";

const input = z.object({ lessonSlug: z.string(), questionIndex: z.number().int().min(0).max(2) });

export async function POST(request: Request) {
  const result = input.safeParse(await request.json());
  if (!result.success) return Response.json({ error: "Invalid explanation request" }, { status: 400 });
  const lesson = seedLessons.find((item) => item.slug === result.data.lessonSlug);
  if (!lesson) return Response.json({ error: "Lesson not found" }, { status: 404 });
  const question = lesson.questions[result.data.questionIndex];
  const fallback = `${question.explanation} Source: ${lesson.sourceTitle}.`;
  const apiKey = await getConfiguration("OPENAI_API_KEY");
  const model = await getConfiguration("OPENAI_MODEL") ?? "gpt-4o-mini";
  if (!apiKey) return Response.json({ explanation: fallback, source: "curated", fallback: true });
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ model, store: false, input: [{ role: "system", content: "You explain WAEC Mathematics to a learner aged 13+. Use only the supplied lesson and answer rationale. Give one concise, encouraging explanation under 90 words. Do not add facts, do not ask for personal data, and finish with the exact supplied source title." }, { role: "user", content: `Lesson: ${lesson.bite}\nQuestion: ${question.prompt}\nCorrect rationale: ${question.explanation}\nSource: ${lesson.sourceTitle}` }] }),
    });
    if (!response.ok) throw new Error("OpenAI request failed");
    const body = await response.json() as { output_text?: string };
    return Response.json({ explanation: body.output_text || fallback, source: lesson.sourceTitle, fallback: false });
  } catch {
    return Response.json({ explanation: fallback, source: "curated", fallback: true });
  }
}
