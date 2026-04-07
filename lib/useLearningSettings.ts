"use client";

import { useState, useEffect } from "react";

const KEY = "tango_new_words_per_day";
export const DEFAULT_NEW_WORDS_PER_DAY = 5;

export function useLearningSettings() {
  const [newWordsPerDay, setNewWordsPerDay] = useState<number>(DEFAULT_NEW_WORDS_PER_DAY);

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 30) {
        setNewWordsPerDay(parsed);
      }
    }
  }, []);

  function updateNewWordsPerDay(n: number) {
    const clamped = Math.max(1, Math.min(30, n));
    setNewWordsPerDay(clamped);
    localStorage.setItem(KEY, String(clamped));
  }

  return { newWordsPerDay, updateNewWordsPerDay };
}

/** Read the stored cap synchronously (for use outside React components). */
export function getNewWordsPerDay(): number {
  if (typeof window === "undefined") return DEFAULT_NEW_WORDS_PER_DAY;
  const stored = localStorage.getItem(KEY);
  if (!stored) return DEFAULT_NEW_WORDS_PER_DAY;
  const parsed = parseInt(stored, 10);
  return !isNaN(parsed) && parsed >= 1 && parsed <= 30 ? parsed : DEFAULT_NEW_WORDS_PER_DAY;
}
