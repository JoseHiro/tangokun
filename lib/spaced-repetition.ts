/** Adds `days` days to a Date and returns a new Date. */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export type SRUpdate = {
  interval: number;
  dueDate: Date;
};

/**
 * Simplified SM-2 spaced repetition.
 *
 * Correct → interval doubles (interval × ease), next review in that many days.
 * Wrong   → interval resets to 1, review tomorrow.
 */
export function computeNextReview(
  correct: boolean,
  currentInterval: number,
  ease: number
): SRUpdate {
  const today = new Date();

  if (correct) {
    const interval = Math.max(1, Math.round(currentInterval * ease));
    return { interval, dueDate: addDays(today, interval) };
  } else {
    return { interval: 1, dueDate: addDays(today, 1) };
  }
}
