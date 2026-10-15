import { describe, expect, it } from "vitest";
import { isReminderDue, nextStreak } from "../lib/progress";

describe("streaks", () => {
  it("starts a new streak for a first completion", () => expect(nextStreak(null, 0, new Date("2026-10-13"))).toBe(1));
  it("continues a consecutive day", () => expect(nextStreak(new Date("2026-10-12"), 4, new Date("2026-10-13"))).toBe(5));
  it("does not double-count the same day", () => expect(nextStreak(new Date("2026-10-13"), 4, new Date("2026-10-13"))).toBe(4));
  it("resets after a missed day", () => expect(nextStreak(new Date("2026-10-10"), 4, new Date("2026-10-13"))).toBe(1));
});

describe("reminders", () => {
  it("matches a learner's local reminder time", () => expect(isReminderDue(new Date("2026-10-13T17:00:00Z"), "18:00", "Africa/Lagos")).toBe(true));
});
