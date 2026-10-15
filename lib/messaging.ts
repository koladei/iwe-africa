import crypto from "node:crypto";
import { seedLessons } from "@/lib/lessons";
import { getConfiguration } from "@/lib/configuration";

export type InboundMessage = { channel: "TELEGRAM" | "WHATSAPP"; senderId: string; text: string; replyId?: string };
export type OutboundMessage = { recipientId: string; text: string; buttons?: { id: string; title: string }[] };

export interface MessagingProvider {
  sendLesson(message: OutboundMessage): Promise<string | null>;
  sendQuiz(message: OutboundMessage): Promise<string | null>;
  sendReminder(message: OutboundMessage): Promise<string | null>;
  sendCircleUpdate(message: OutboundMessage): Promise<string | null>;
  parseInboundMessage(payload: unknown): InboundMessage[];
}

async function telegramSend(message: OutboundMessage) {
  const token = await getConfiguration("TELEGRAM_BOT_TOKEN");
  if (!token) return null;
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: message.recipientId, text: message.text, reply_markup: message.buttons ? { inline_keyboard: [message.buttons.map((button) => ({ text: button.title, callback_data: button.id }))] } : undefined }),
  });
  if (!response.ok) throw new Error(`Telegram send failed: ${response.status}`);
  const body = await response.json() as { result?: { message_id?: number } };
  return body.result?.message_id?.toString() ?? null;
}

export const telegramProvider: MessagingProvider = {
  sendLesson: telegramSend, sendQuiz: telegramSend, sendReminder: telegramSend, sendCircleUpdate: telegramSend,
  parseInboundMessage(payload) {
    const update = payload as { message?: { chat?: { id?: number }; text?: string }; callback_query?: { message?: { chat?: { id?: number } }; data?: string } };
    const message = update.message;
    if (message?.chat?.id && message.text) return [{ channel: "TELEGRAM", senderId: String(message.chat.id), text: message.text }];
    const callback = update.callback_query;
    if (callback?.message?.chat?.id && callback.data) return [{ channel: "TELEGRAM", senderId: String(callback.message.chat.id), text: callback.data, replyId: callback.data }];
    return [];
  },
};

async function whatsAppSend(message: OutboundMessage) {
  const token = await getConfiguration("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = await getConfiguration("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneNumberId) return null;
  const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: message.recipientId, type: "text", text: { body: message.text } }),
  });
  if (!response.ok) throw new Error(`WhatsApp send failed: ${response.status}`);
  const body = await response.json() as { messages?: { id?: string }[] };
  return body.messages?.[0]?.id ?? null;
}

async function whatsAppReminder(message: OutboundMessage) {
  const token = await getConfiguration("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = await getConfiguration("WHATSAPP_PHONE_NUMBER_ID");
  const template = await getConfiguration("WHATSAPP_REMINDER_TEMPLATE");
  if (!token || !phoneNumberId) return null;
  if (!template) return whatsAppSend(message);
  const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: message.recipientId, type: "template", template: { name: template, language: { code: "en_US" } } }),
  });
  if (!response.ok) throw new Error(`WhatsApp template send failed: ${response.status}`);
  const body = await response.json() as { messages?: { id?: string }[] };
  return body.messages?.[0]?.id ?? null;
}

export const whatsAppProvider: MessagingProvider = {
  sendLesson: whatsAppSend, sendQuiz: whatsAppSend, sendReminder: whatsAppReminder, sendCircleUpdate: whatsAppSend,
  parseInboundMessage(payload) {
    const root = payload as { entry?: { changes?: { value?: { contacts?: { wa_id?: string }[]; messages?: { from?: string; text?: { body?: string }; interactive?: { button_reply?: { id?: string } } }[] } }[] }[] };
    const value = root.entry?.[0]?.changes?.[0]?.value;
    return (value?.messages ?? []).flatMap((message) => {
      const text = message.text?.body ?? message.interactive?.button_reply?.id;
      return message.from && text ? [{ channel: "WHATSAPP" as const, senderId: message.from, text, replyId: message.interactive?.button_reply?.id }] : [];
    });
  },
};

export async function validWhatsAppSignature(rawBody: string, signature: string | null) {
  const secret = await getConfiguration("WHATSAPP_APP_SECRET");
  if (!secret || !signature) return false;
  const expected = `sha256=${crypto.createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const received = Buffer.from(signature);
  const calculated = Buffer.from(expected);
  return received.length === calculated.length && crypto.timingSafeEqual(calculated, received);
}

export function todayLessonMessage() {
  const lesson = seedLessons[new Date().getDate() % seedLessons.length];
  return `Today’s 5-minute bite: ${lesson.title}\n\n${lesson.bite}\n\nSource: ${lesson.sourceTitle}`;
}
