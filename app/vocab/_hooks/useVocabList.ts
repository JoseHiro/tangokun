"use client";

import { useState, useEffect } from "react";
import type { MasteryState } from "@/features/progress/types";
import type { WordProgressSummary } from "@/app/api/progress/words/route";
import { validateVocabFields, type VocabFieldErrors } from "@/lib/vocab-validation";

export type Word = { id: string; jp: string; en: string; createdAt: string };

export const PAGE_SIZE = 20;

function buildParams(
  page: number,
  search: string,
  deck: string,
  mastery: string,
): URLSearchParams {
  const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (search) params.set("q", search);
  if (deck !== "all") params.set("deck", deck);
  if (mastery !== "all") params.set("mastery", mastery);
  return params;
}

export function useVocabList(t: (key: string) => string) {
  // List
  const [words, setWords] = useState<Word[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [allWordsForEditor, setAllWordsForEditor] = useState<Word[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, WordProgressSummary>>({});

  // Filters & pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deckFilter, setDeckFilter] = useState("all");
  const [masteryFilter, setMasteryFilter] = useState<MasteryState | "all">("all");
  const [page, setPage] = useState(1);

  // Add form
  const [jp, setJp] = useState("");
  const [en, setEn] = useState("");
  const [adding, setAdding] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<VocabFieldErrors>({});

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // Reset to page 1 on any filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, deckFilter, masteryFilter]);

  // Fetch current page
  useEffect(() => {
    let cancelled = false;
    setFetching(true);
    fetch(`/api/vocab?${buildParams(page, debouncedSearch, deckFilter, masteryFilter)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setWords(Array.isArray(data.words) ? data.words : []);
        setTotal(typeof data.total === "number" ? data.total : 0);
        setFetching(false);
      });
    return () => { cancelled = true; };
  }, [page, debouncedSearch, deckFilter, masteryFilter]);

  // Fetch full word list for deck editor (once)
  async function fetchAllForEditor() {
    const res = await fetch("/api/vocab?pageSize=5000");
    const data = await res.json();
    setAllWordsForEditor(Array.isArray(data.words) ? data.words : []);
  }
  useEffect(() => { fetchAllForEditor(); }, []);

  // Fetch progress map (once)
  useEffect(() => {
    fetch("/api/progress/words")
      .then((r) => r.json())
      .then((data: WordProgressSummary[]) => {
        if (!Array.isArray(data)) return;
        const map: Record<string, WordProgressSummary> = {};
        data.forEach((p) => { map[p.wordId] = p; });
        setProgressMap(map);
      })
      .catch(() => {});
  }, []);

  // Re-fetch the current page after a mutation (add / delete)
  async function refetch() {
    const res = await fetch(`/api/vocab?${buildParams(page, debouncedSearch, deckFilter, masteryFilter)}`);
    const data = await res.json();
    setWords(Array.isArray(data.words) ? data.words : []);
    setTotal(typeof data.total === "number" ? data.total : 0);
  }

  async function handleAdd(e: React.FormEvent, onSuccess?: () => void) {
    e.preventDefault();
    const errors = validateVocabFields(jp, en, {
      jpRequired: t("errorJpRequired"),
      jpNotJapanese: t("errorJpNotJapanese"),
      jpTooLong: t("errorJpTooLong"),
      enRequired: t("errorEnRequired"),
      enTooLong: t("errorEnTooLong"),
    });
    if (errors.jp || errors.en) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setAdding(true);
    const res = await fetch("/api/vocab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jp: jp.trim(), en: en.trim() }),
    });
    if (!res.ok) {
      const data = await res.json();
      if (data.code === "DUPLICATE") setFieldErrors({ jp: t("errorDuplicate") });
      setAdding(false);
      return;
    }
    setJp("");
    setEn("");
    setFieldErrors({});
    await Promise.all([refetch(), fetchAllForEditor()]);
    setAdding(false);
    onSuccess?.();
  }

  async function handleDelete(id: string) {
    await fetch("/api/vocab", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setAllWordsForEditor((prev) => prev.filter((w) => w.id !== id));
    await refetch();
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return {
    words, total, fetching,
    allWordsForEditor, progressMap,
    searchQuery, setSearchQuery,
    deckFilter, setDeckFilter,
    masteryFilter, setMasteryFilter,
    page, setPage, totalPages, from, to,
    jp, setJp, en, setEn, adding, fieldErrors, setFieldErrors,
    handleAdd, handleDelete,
  };
}
