import type { ReviewRating, SrsState } from "./types";

export function createInitialSrs(now = new Date()): SrsState {
  return {
    dueAt: now.toISOString(),
    intervalDays: 0,
    ease: 2.5,
    reviews: 0,
    lapses: 0
  };
}

export function isDue(srs: SrsState, now = new Date()): boolean {
  return new Date(srs.dueAt).getTime() <= now.getTime();
}

export function reviewSrs(srs: SrsState, rating: ReviewRating, now = new Date()): SrsState {
  const next = { ...srs };
  next.reviews += 1;
  next.lastReviewedAt = now.toISOString();

  if (rating === "again") {
    next.lapses += 1;
    next.ease = Math.max(1.3, next.ease - 0.2);
    next.intervalDays = 0;
    next.dueAt = addMinutes(now, 10).toISOString();
    return next;
  }

  if (rating === "easy") {
    next.ease = Math.min(3.2, next.ease + 0.15);
  }

  if (next.intervalDays === 0) {
    next.intervalDays = rating === "easy" ? 3 : 1;
  } else if (next.intervalDays === 1) {
    next.intervalDays = rating === "easy" ? 7 : 3;
  } else {
    const multiplier = rating === "easy" ? next.ease + 0.6 : next.ease;
    next.intervalDays = Math.max(next.intervalDays + 1, Math.round(next.intervalDays * multiplier));
  }

  next.dueAt = addDays(now, next.intervalDays).toISOString();
  return next;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(6, 0, 0, 0);
  return next;
}
