import { telegramProvider, todayLessonMessage } from "@/lib/messaging";
import { getConfiguration } from "@/lib/configuration";

export async function POST(request: Request) {
  const configuredSecret = await getConfiguration("TELEGRAM_WEBHOOK_SECRET");
  const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token");
  if (configuredSecret && receivedSecret !== configuredSecret) return new Response("Unauthorized", { status: 401 });
  const messages = telegramProvider.parseInboundMessage(await request.json());
  await Promise.all(messages.map(async (message) => {
    if (message.text === "/start" || message.text === "/learn") {
      await telegramProvider.sendLesson({ recipientId: message.senderId, text: await todayLessonMessage(), buttons: [{ id: "learn_today", title: "Start today’s check-in" }] });
    }
    if (message.text === "/progress") await telegramProvider.sendLesson({ recipientId: message.senderId, text: "Your progress is private. Open your Iwe dashboard to see your completed lessons and steady streak." });
  }));
  return Response.json({ ok: true });
}
