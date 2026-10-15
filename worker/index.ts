import { Channel, DeliveryStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { isReminderDue } from "../lib/progress";
import { telegramProvider, todayLessonMessage, whatsAppProvider } from "../lib/messaging";

async function deliverDueReminders() {
  const now = new Date();
  now.setSeconds(0, 0);
  const learners = await prisma.learner.findMany({ include: { identities: true } });
  for (const learner of learners) {
    if (!isReminderDue(now, learner.reminderTime, learner.timezone)) continue;
    for (const identity of learner.identities) {
      try {
        const delivery = await prisma.messageDelivery.create({ data: { learnerId: learner.id, channel: identity.channel, messageType: "DAILY_REMINDER", dueAt: now } });
        const provider = identity.channel === Channel.TELEGRAM ? telegramProvider : whatsAppProvider;
        const providerId = await provider.sendReminder({ recipientId: identity.channelId, text: `${await todayLessonMessage()}\n\nReply LEARN to begin.` });
        await prisma.messageDelivery.update({ where: { id: delivery.id }, data: { status: DeliveryStatus.SENT, providerId, sentAt: new Date() } });
      } catch (error) {
        console.error(JSON.stringify({ event: "reminder_delivery_failed", learnerId: learner.id, channel: identity.channel, error: error instanceof Error ? error.message : "unknown" }));
      }
    }
  }
}

async function run() {
  await deliverDueReminders();
  await prisma.$disconnect();
}

run().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
