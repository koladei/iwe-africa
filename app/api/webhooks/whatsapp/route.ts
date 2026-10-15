import { validWhatsAppSignature, whatsAppProvider, todayLessonMessage } from "@/lib/messaging";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("hub.mode") === "subscribe" && searchParams.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN) return new Response(searchParams.get("hub.challenge") ?? "", { status: 200 });
  return new Response("Verification failed", { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!validWhatsAppSignature(rawBody, request.headers.get("x-hub-signature-256"))) return new Response("Unauthorized", { status: 401 });
  const messages = whatsAppProvider.parseInboundMessage(JSON.parse(rawBody));
  await Promise.all(messages.map(async (message) => {
    if (["learn", "start", "/learn"].includes(message.text.toLowerCase())) await whatsAppProvider.sendLesson({ recipientId: message.senderId, text: todayLessonMessage() });
  }));
  return Response.json({ ok: true });
}
