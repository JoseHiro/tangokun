"use client";

import { useState, useEffect } from "react";

export type Deck = { id: string; name: string; vocabIds: string[] };

export const MAX_DECKS = 5;

export function useDeckManager() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckFetching, setDeckFetching] = useState(true);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editVocabIds, setEditVocabIds] = useState<Set<string>>(new Set());
  const [deckSaving, setDeckSaving] = useState(false);

  useEffect(() => {
    fetch("/api/decks")
      .then((r) => r.json())
      .then((data) => {
        setDecks(
          Array.isArray(data)
            ? data.map((d: { id: string; name: string; vocabIds: unknown }) => ({
                id: d.id,
                name: d.name,
                vocabIds: Array.isArray(d.vocabIds) ? d.vocabIds : [],
              }))
            : [],
        );
        setDeckFetching(false);
      })
      .catch(() => { setDeckFetching(false); });
  }, []);

  async function createDeck() {
    if (decks.length >= MAX_DECKS) return;
    const res = await fetch("/api/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) return;
    const deck = await res.json();
    setDecks((prev) => [...prev, { id: deck.id, name: deck.name, vocabIds: [] }]);
    setEditingDeckId(deck.id);
    setEditName(deck.name);
    setEditVocabIds(new Set());
  }

  function startEditDeck(deck: Deck) {
    setEditingDeckId(deck.id);
    setEditName(deck.name);
    setEditVocabIds(new Set(deck.vocabIds));
  }

  function cancelEditDeck() {
    setEditingDeckId(null);
  }

  async function saveDeck() {
    if (!editingDeckId) return;
    setDeckSaving(true);
    const res = await fetch(`/api/decks/${editingDeckId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() || "Deck", vocabIds: Array.from(editVocabIds) }),
    });
    setDeckSaving(false);
    if (!res.ok) return;
    const updated = await res.json();
    setDecks((prev) =>
      prev.map((d) =>
        d.id === updated.id
          ? { ...d, name: updated.name, vocabIds: Array.isArray(updated.vocabIds) ? updated.vocabIds : [] }
          : d,
      ),
    );
    setEditingDeckId(null);
  }

  // Returns true if deletion succeeded. The caller is responsible for any
  // side-effects that involve other state (e.g. resetting the deck filter).
  async function deleteDeck(id: string): Promise<boolean> {
    const res = await fetch(`/api/decks/${id}`, { method: "DELETE" });
    if (!res.ok) return false;
    setDecks((prev) => prev.filter((d) => d.id !== id));
    if (editingDeckId === id) setEditingDeckId(null);
    return true;
  }

  function toggleEditVocab(id: string) {
    setEditVocabIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return {
    decks, deckFetching,
    editingDeckId, editName, setEditName, editVocabIds, deckSaving,
    createDeck, startEditDeck, cancelEditDeck, saveDeck, deleteDeck, toggleEditVocab,
  };
}
