"use client";

import { useState, useEffect } from "react";
import type { Direction, VocabWord, GrammarItem } from "../_types";
import type { WordProgressSummary } from "@/app/api/progress/words/route";
import type { MasteryState } from "@/features/progress/types";
import { getNewWordsPerDay } from "@/lib/useLearningSettings";

// Days to wait before a word is due for review again

const MASTERY_INTERVAL: Record<MasteryState, number> = {
  new:      0,  // always due (never practiced)
  learning: 1,
  familiar: 3,
  strong:   7,
  mastered: 14,
};

function isDue(progress: WordProgressSummary | undefined): boolean {
  if (!progress || !progress.lastSeen) return true; // never practiced
  const intervalDays = MASTERY_INTERVAL[progress.mastery] ?? 0;
  const dueDate = new Date(progress.lastSeen);
  dueDate.setDate(dueDate.getDate() + intervalDays);
  return dueDate <= new Date();
}

const JLPT_ORDER = ["N5", "N4", "N3", "N2", "N1"];

export type Deck = { id: string; name: string; vocabIds: string[] };

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item) || "Other";
    (acc[k] ??= []).push(item);
    return acc;
  }, {});
}

export function useSetupData() {
  const [direction, setDirection] = useState<Direction>("jp-to-en");
  const [allVocab, setAllVocab] = useState<VocabWord[]>([]);
  const [selectedVocabIds, setSelectedVocabIds] = useState<Set<string>>(new Set());
  const [vocabLoading, setVocabLoading] = useState(true);
  const [allGrammar, setAllGrammar] = useState<GrammarItem[]>([]);
  const [selectedGrammarIds, setSelectedGrammarIds] = useState<Set<string>>(new Set());
  const [grammarLoading, setGrammarLoading] = useState(true);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [decksLoading, setDecksLoading] = useState(true);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, WordProgressSummary>>({});
  const [progressLoading, setProgressLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vocab?pageSize=5000")
      .then((r) => r.json())
      .then((data: { words: VocabWord[] }) => {
        const words = Array.isArray(data.words) ? data.words : [];
        setAllVocab(words);
        setSelectedVocabIds(new Set());
      })
      .catch(() => {})
      .finally(() => setVocabLoading(false));

    fetch("/api/grammar")
      .then((r) => r.json())
      .then((data: GrammarItem[]) => setAllGrammar(data))
      .catch(() => {})
      .finally(() => setGrammarLoading(false));

    fetch("/api/decks")
      .then((r) => r.json())
      .then((data: Deck[]) => {
        setDecks(Array.isArray(data) ? data.map((d) => ({ ...d, vocabIds: Array.isArray(d.vocabIds) ? d.vocabIds : [] })) : []);
      })
      .catch(() => {})
      .finally(() => setDecksLoading(false));

    fetch("/api/progress/words")
      .then((r) => r.json())
      .then((data: WordProgressSummary[]) => {
        if (!Array.isArray(data)) return;
        const map: Record<string, WordProgressSummary> = {};
        data.forEach((p) => { map[p.wordId] = p; });
        setProgressMap(map);
      })
      .catch(() => {})
      .finally(() => setProgressLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDeckId || !allVocab.length) return;
    const deck = decks.find((d) => d.id === selectedDeckId);
    if (!deck) return;
    const validIds = new Set(allVocab.map((w) => w.id));
    const idsFromDeck = deck.vocabIds.filter((id) => validIds.has(id));
    setSelectedVocabIds(new Set(idsFromDeck));
  }, [selectedDeckId, decks, allVocab]);

  function toggleVocab(id: string) {
    setSelectedVocabIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVocab() {
    setSelectedVocabIds(
      selectedVocabIds.size === allVocab.length
        ? new Set()
        : new Set(allVocab.map((w) => w.id)),
    );
  }

  function focusWeak() {
    const weakIds = allVocab
      .filter((w) => {
        const m = progressMap[w.id]?.mastery ?? "new";
        return m === "new" || m === "learning";
      })
      .map((w) => w.id);
    setSelectedVocabIds(new Set(weakIds.length > 0 ? weakIds : allVocab.map((w) => w.id)));
  }

  const weakCount = allVocab.filter((w) => {
    const m = progressMap[w.id]?.mastery ?? "new";
    return m === "new" || m === "learning";
  }).length;

  function focusDue() {
    const dueIds = allVocab.filter((w) => isDue(progressMap[w.id])).map((w) => w.id);
    setSelectedVocabIds(new Set(dueIds.length > 0 ? dueIds : allVocab.map((w) => w.id)));
  }

  const dueCount = allVocab.filter((w) => isDue(progressMap[w.id])).length;

  // Words practiced before with elapsed interval (excludes never-practiced)
  const dueForReviewCount = allVocab.filter((w) => {
    const p = progressMap[w.id];
    return p?.lastSeen && isDue(p);
  }).length;

  // Words never practiced yet
  const newWordsAvailable = allVocab.filter((w) => !progressMap[w.id]?.lastSeen).length;

  /** Selects due-for-review words + up to N new words. Returns the resulting Set. */
  function autoSelectForStudy(): Set<string> {
    const dueReview = allVocab.filter((w) => {
      const p = progressMap[w.id];
      return p?.lastSeen && isDue(p);
    });
    const newWords = allVocab
      .filter((w) => !progressMap[w.id]?.lastSeen)
      .slice(0, getNewWordsPerDay());
    const ids = new Set([...dueReview, ...newWords].map((w) => w.id));
    setSelectedVocabIds(ids);
    return ids;
  }

  function toggleGrammar(id: string) {
    setSelectedGrammarIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const grammarByJlpt = groupBy(allGrammar, (g) => g.jlptLevel ?? "Other");
  const jlptGroups = [
    ...JLPT_ORDER.filter((l) => grammarByJlpt[l]),
    ...Object.keys(grammarByJlpt).filter((k) => !JLPT_ORDER.includes(k)),
  ];
  const grammarByGenki = groupBy(allGrammar, (g) =>
    g.source?.startsWith("Genki") ? g.source : "__non_genki__",
  );
  const genkiGroups = Object.keys(grammarByGenki)
    .filter((k) => k !== "__non_genki__" && k !== "Other")
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+$/)?.[0] ?? "0", 10);
      const numB = parseInt(b.match(/\d+$/)?.[0] ?? "0", 10);
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });

  return {
    direction, setDirection,
    allVocab, selectedVocabIds, vocabLoading,
    decks, decksLoading, selectedDeckId, setSelectedDeckId,
    allGrammar, selectedGrammarIds, grammarLoading,
    toggleVocab, toggleAllVocab, toggleGrammar,
    grammarByJlpt, jlptGroups,
    grammarByGenki, genkiGroups,
    progressMap, progressLoading,
    focusWeak, weakCount,
    focusDue, dueCount,
    dueForReviewCount, newWordsAvailable, autoSelectForStudy,
  };
}
