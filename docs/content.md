# Lesson-content guide

Iwe’s seed content lives in `lib/lessons.ts` and is written to the database through `prisma/seed.ts`.

## Required lesson shape

Each lesson needs a topic, title, short Concept Bite, credible source title/URL, and exactly three multiple-choice questions. A Concept Bite should stay under 150 words, use clear English, and explain one assessable idea.

Each question needs one clearly correct option and an explanation that teaches the reasoning, not merely the answer.

## Source and quality rules

- Write original explanations; do not reproduce proprietary textbooks or past-paper questions.
- Link each bite to a credible syllabus or open educational source.
- Match the named WAEC Mathematics topic before presenting it as WAEC-aligned.
- Avoid culturally unfamiliar examples when a simple local-neutral example works.
- Keep payloads text-first. Audio is optional enhancement, never the only way to access a lesson.

## Adding content

1. Add or update a lesson record in `lib/lessons.ts`.
2. Run `npm run db:seed`; existing lesson slugs are preserved by the current seed script.
3. Verify the lesson in `/dashboard` and the source URL manually.
4. Add tests if changing scoring, lesson ordering, or progression behavior.
