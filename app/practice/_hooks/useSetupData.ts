"use client";

import { useState, useEffect } from "react";
import type { Direction, GrammarTab, VocabWord, GrammarItem } from "../_types";

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
  const [grammarTab, setGrammarTab] = useState<GrammarTab>("jlpt");
  const [allVocab, setAllVocab] = useState<VocabWord[]>([]);
  const [selectedVocabIds, setSelectedVocabIds] = useState<Set<string>>(new Set());
  const [vocabLoading, setVocabLoading] = useState(true);
  const [allGrammar, setAllGrammar] = useState<GrammarItem[]>([]);
  const [selectedGrammarIds, setSelectedGrammarIds] = useState<Set<string>>(new Set());
  const [grammarLoading, setGrammarLoading] = useState(true);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [decksLoading, setDecksLoading] = useState(true);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vocab")
      .then((r) => r.json())
      .then((data: VocabWord[]) => {
        setAllVocab(data);
        setSelectedVocabIds(new Set(data.map((w) => w.id)));
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
    g.source && g.source !== "built-in" ? g.source : "",
  );
  const genkiGroups = Object.keys(grammarByGenki).filter((k) => k !== "");

  return {
    direction, setDirection,
    grammarTab, setGrammarTab,
    allVocab, selectedVocabIds, vocabLoading,
    decks, decksLoading, selectedDeckId, setSelectedDeckId,
    allGrammar, selectedGrammarIds, grammarLoading,
    toggleVocab, toggleAllVocab, toggleGrammar,
    grammarByJlpt, jlptGroups,
    grammarByGenki, genkiGroups,
  };
}
