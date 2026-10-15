export function nextStreak(
  lastCompletedOn: Date | null,
  currentStreak: number,
  completionDate: Date,
): number {
  if (!lastCompletedOn) return 1;
  const last = new Date(lastCompletedOn);
  const next = new Date(completionDate);
  last.setHours(0, 0, 0, 0);
  next.setHours(0, 0, 0, 0);
  const difference = Math.round((next.getTime() - last.getTime()) / 86_400_000);
  if (difference === 0) return currentStreak;
  return difference === 1 ? currentStreak + 1 : 1;
}

export function isReminderDue(now: Date, reminderTime: string, timezone: string) {
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  return time === reminderTime;
}
