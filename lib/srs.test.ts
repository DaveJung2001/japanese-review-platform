import { describe, expect, it } from "vitest";
import { createInitialSrs, isDue, reviewSrs } from "./srs";

describe("srs", () => {
  it("starts due immediately", () => {
    const now = new Date("2026-06-30T00:00:00.000Z");
    const srs = createInitialSrs(now);

    expect(isDue(srs, now)).toBe(true);
  });

  it("returns an again card in ten minutes", () => {
    const now = new Date("2026-06-30T00:00:00.000Z");
    const reviewed = reviewSrs(createInitialSrs(now), "again", now);

    expect(reviewed.intervalDays).toBe(0);
    expect(new Date(reviewed.dueAt).getTime()).toBe(now.getTime() + 10 * 60 * 1000);
  });

  it("moves a good new card to tomorrow morning", () => {
    const now = new Date("2026-06-30T00:00:00.000Z");
    const reviewed = reviewSrs(createInitialSrs(now), "good", now);

    expect(reviewed.intervalDays).toBe(1);
    expect(reviewed.dueAt).toBe("2026-06-30T21:00:00.000Z");
  });
});
