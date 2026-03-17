"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Upload, Pencil, Trash2, Plus, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import PageContainer from "@/components/layout/page-container";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input, { inputClassName } from "@/components/ui/input";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/table";
import { MasteryBadge, MASTERY_ORDER } from "@/components/ui/mastery-badge";
import type { MasteryState } from "@/features/progress/types";
import type { WordProgressSummary } from "@/app/api/progress/words/route";
import { validateVocabFields, type VocabFieldErrors } from "@/lib/vocab-validation";

type Word = { id: string; jp: string; en: string; createdAt: string };
type Deck = { id: string; name: string; vocabIds: string[] };
type ImportStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; imported: number; skipped: number }
  | { state: "error"; message: string };
type ActivePanel = "none" | "add" | "import";

const MAX_DECKS = 5;
const PAGE_SIZE = 20;

export default function VocabPage() {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [words, setWords] = useState<Word[]>([]);
  const [jp, setJp] = useState("");
  const [en, setEn] = useState("");
  const [adding, setAdding] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<VocabFieldErrors>({});
  const [fetching, setFetching] = useState(true);
  const [importStatus, setImportStatus] = useState<ImportStatus>({ state: "idle" });
  const [isDragging, setIsDragging] = useState(false);

  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckFetching, setDeckFetching] = useState(true);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editVocabIds, setEditVocabIds] = useState<Set<string>>(new Set());
  const [deckSaving, setDeckSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [deckFilter, setDeckFilter] = useState("all");
  const [masteryFilter, setMasteryFilter] = useState<MasteryState | "all">("all");
  const [page, setPage] = useState(1);
  const [activePanel, setActivePanel] = useState<ActivePanel>("none");

  // Per-word progress
  const [progressMap, setProgressMap] = useState<Record<string, WordProgressSummary>>({});

  // Compute word → first deck name
  const wordDeckMap = useMemo(() => {
    const map: Record<string, string> = {};
    decks.forEach((d) => d.vocabIds.forEach((vid) => { if (!map[vid]) map[vid] = d.name; }));
    return map;
  }, [decks]);

  // Filtered words
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const activeDeck = deckFilter !== "all" ? decks.find((d) => d.id === deckFilter) : null;
    return words
      .filter((w) => !activeDeck || activeDeck.vocabIds.includes(w.id))
      .filter((w) => !q || w.jp.toLowerCase().includes(q) || w.en.toLowerCase().includes(q))
      .filter((w) => {
        if (masteryFilter === "all") return true;
        const m = progressMap[w.id]?.mastery ?? "new";
        return m === masteryFilter;
      });
  }, [words, decks, deckFilter, masteryFilter, searchQuery, progressMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [searchQuery, deckFilter, masteryFilter]);

  async function fetchWords() {
    const res = await fetch("/api/vocab");
    const data = await res.json();
    setWords(Array.isArray(data) ? data : []);
    setFetching(false);
  }

  async function fetchDecks() {
    const res = await fetch("/api/decks");
    const data = await res.json();
    setDecks(Array.isArray(data) ? data.map((d: { id: string; name: string; vocabIds: unknown }) => ({
      id: d.id,
      name: d.name,
      vocabIds: Array.isArray(d.vocabIds) ? d.vocabIds : [],
    })) : []);
    setDeckFetching(false);
  }

  useEffect(() => { fetchWords(); }, []);
  useEffect(() => { fetchDecks(); }, []);
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

  async function handleAdd(e: React.FormEvent) {
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
      if (data.code === "DUPLICATE") {
        setFieldErrors({ jp: t("errorDuplicate") });
      }
      setAdding(false);
      return;
    }
    setJp("");
    setEn("");
    setFieldErrors({});
    await fetchWords();
    setAdding(false);
    setActivePanel("none");
  }

  async function handleDelete(id: string) {
    await fetch("/api/vocab", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setWords((prev) => prev.filter((w) => w.id !== id));
  }

  async function handleImportFile(file: File) {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv" && file.type !== "text/plain") {
      setImportStatus({ state: "error", message: "Please upload a .csv file." });
      return;
    }
    setImportStatus({ state: "loading" });
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/vocab/import", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) {
      setImportStatus({ state: "error", message: data.error ?? t("importFailed") });
      return;
    }
    setImportStatus({ state: "success", imported: data.imported, skipped: data.skipped });
    await fetchWords();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleImportFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImportFile(file);
  }

  function togglePanel(panel: "add" | "import") {
    setActivePanel((prev) => (prev === panel ? "none" : panel));
    if (panel === "import") setImportStatus({ state: "idle" });
  }

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

  function cancelEditDeck() { setEditingDeckId(null); }

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
    setDecks((prev) => prev.map((d) => d.id === updated.id ? { ...d, name: updated.name, vocabIds: Array.isArray(updated.vocabIds) ? updated.vocabIds : [] } : d));
    setEditingDeckId(null);
  }

  async function deleteDeck(id: string) {
    if (!confirm(t("deleteDeck") + "?")) return;
    const res = await fetch(`/api/decks/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setDecks((prev) => prev.filter((d) => d.id !== id));
    if (editingDeckId === id) setEditingDeckId(null);
    if (deckFilter === id) setDeckFilter("all");
  }

  function toggleEditVocab(id: string) {
    setEditVocabIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <PageContainer title={t("vocabTitle")} subtitle={t("vocabSubtitle")}>
      <div className="space-y-6">

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
          <div className="flex gap-2 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <Input
                type="search"
                placeholder={t("searchVocab")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                aria-label={t("searchVocab")}
              />
            </div>

            {/* Deck filter */}
            {decks.length > 0 && (
              <select
                value={deckFilter}
                onChange={(e) => setDeckFilter(e.target.value)}
                className={`${inputClassName} w-auto pr-8 cursor-pointer`}
                aria-label="Filter by deck"
              >
                <option value="all">{t("allDecks")}</option>
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}

            {/* Mastery filter */}
            <select
              value={masteryFilter}
              onChange={(e) => setMasteryFilter(e.target.value as MasteryState | "all")}
              className={`${inputClassName} w-auto pr-8 cursor-pointer`}
              aria-label="Filter by mastery"
            >
              <option value="all">{t("allLevels")}</option>
              {MASTERY_ORDER.map((m) => (
                <option key={m} value={m}>{t(`mastery_${m}`)}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              variant="secondary"
              onClick={() => togglePanel("import")}
              className={activePanel === "import" ? "ring-2 ring-green-300" : ""}
            >
              <Upload size={14} />
              {t("importCSV")}
            </Button>
            <Button
              variant="primary"
              onClick={() => togglePanel("add")}
              className={`bg-green-600 hover:bg-green-700 ${activePanel === "add" ? "ring-2 ring-green-300" : ""}`}
            >
              <Plus size={14} />
              {t("addWord")}
            </Button>
          </div>
        </div>

        {/* ── Add Word panel ── */}
        {activePanel === "add" && (
          <div className="border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 rounded-xl p-4">
            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 items-start">
              <div className="flex-1 min-w-0">
                <Input
                  type="text"
                  placeholder={t("placeholderJp")}
                  value={jp}
                  onChange={(e) => { setJp(e.target.value); setFieldErrors((prev) => ({ ...prev, jp: undefined })); }}
                  autoFocus
                  className={fieldErrors.jp ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}
                />
                {fieldErrors.jp && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.jp}</p>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Input
                  type="text"
                  placeholder={t("placeholderEn")}
                  value={en}
                  onChange={(e) => { setEn(e.target.value); setFieldErrors((prev) => ({ ...prev, en: undefined })); }}
                  className={fieldErrors.en ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}
                />
                {fieldErrors.en && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.en}</p>
                )}
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={adding}
                className="shrink-0 bg-green-600 hover:bg-green-700"
              >
                {adding ? "Adding…" : t("addWord")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setActivePanel("none"); setFieldErrors({}); }}
                className="shrink-0"
              >
                <X size={14} />
              </Button>
            </form>
          </div>
        )}

        {/* ── Import CSV panel ── */}
        {activePanel === "import" && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={handleFileChange}
            />
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 py-8 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                isDragging
                  ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-green-400 hover:bg-gray-50 dark:hover:bg-gray-900/40"
              }`}
            >
              <Upload size={20} className={isDragging ? "text-green-500" : "text-gray-400"} />
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {importStatus.state === "loading" ? t("importing") : t("importCSV")}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{t("importDropLabel")}</p>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">{t("importFormat")}</p>
              </div>
            </div>
            {importStatus.state === "success" && (
              <p className="text-sm text-green-600 dark:text-green-400">
                {importStatus.imported} {t("importSuccess")}
                {importStatus.skipped > 0 && (
                  <span className="text-gray-400 ml-2">({importStatus.skipped} {t("importSkipped")})</span>
                )}
              </p>
            )}
            {importStatus.state === "error" && (
              <p className="text-sm text-red-500">{importStatus.message}</p>
            )}
          </div>
        )}

        {/* ── Word table ── */}
        {fetching ? (
          <p className="text-sm text-gray-400">{t("loading")}</p>
        ) : words.length === 0 ? (
          <p className="text-sm text-gray-400">{t("noWords")}</p>
        ) : (
          <div className="space-y-3">
            {/* Result count */}
            <p className="text-xs text-gray-400">
              {t("showingRange")
                .replace("{{from}}", String(filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1))
                .replace("{{to}}", String(Math.min(page * PAGE_SIZE, filtered.length)))
                .replace("{{total}}", String(filtered.length))}
              {(searchQuery.trim() || deckFilter !== "all") && filtered.length !== words.length && ` (${words.length} total)`}
            </p>

            <Table>
              <TableHead>
                <tr>
                  <Th>{t("colJapanese")}</Th>
                  <Th>{t("colEnglish")}</Th>
                  <Th>{t("colDeck")}</Th>
                  <Th>{t("colProgress")}</Th>
                  <Th className="w-12" />
                </tr>
              </TableHead>
              <TableBody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                      {t("searchNoMatches").replace("{{query}}", searchQuery.trim())}
                    </td>
                  </tr>
                ) : (
                  paginated.map((word) => (
                    <TableRow key={word.id}>
                      <Td className="font-medium text-base">{word.jp}</Td>
                      <Td className="text-gray-500 dark:text-gray-400">{word.en}</Td>
                      <Td>
                        {wordDeckMap[word.id] && (
                          <span className="inline-block text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                            {wordDeckMap[word.id]}
                          </span>
                        )}
                      </Td>
                      <Td>
                        <MasteryBadge mastery={progressMap[word.id]?.mastery ?? "new"} variant="pill" />
                      </Td>
                      <Td className="text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(word.id)}
                          className="p-1.5 rounded text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          aria-label={t("removeWord")}
                        >
                          <Trash2 size={14} />
                        </button>
                      </Td>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} /> Prev
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? "bg-green-600 text-white"
                          : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Decks ── */}
        <Card padding="md">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {t("decks")}
            </h2>
            <Button
              variant="secondary"
              className="text-sm px-3 py-1.5"
              onClick={createDeck}
              disabled={deckFetching || decks.length >= MAX_DECKS}
            >
              {t("createDeck")}
            </Button>
          </div>
          {decks.length >= MAX_DECKS && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t("maxDecks")}</p>
          )}
          {deckFetching ? (
            <p className="text-sm text-gray-400">{t("loading")}</p>
          ) : decks.length === 0 ? (
            <p className="text-sm text-gray-400">{t("createDeck")} to group words for practice.</p>
          ) : (
            <ul className="space-y-2">
              {decks.map((deck) => (
                <li
                  key={deck.id}
                  className="flex items-center justify-between gap-2 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  {editingDeckId === deck.id ? (
                    <div className="flex-1 space-y-3">
                      <Input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder={t("deckName")}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t("selectWordsForDeck")}</p>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                        {words.length === 0 ? (
                          <p className="text-xs text-gray-400">{t("noWords")}</p>
                        ) : (
                          words.map((w) => (
                            <label key={w.id} className="flex items-center gap-2 cursor-pointer text-sm">
                              <input
                                type="checkbox"
                                checked={editVocabIds.has(w.id)}
                                onChange={() => toggleEditVocab(w.id)}
                                className="rounded border-gray-300 dark:border-gray-600"
                              />
                              <span className="font-medium text-gray-800 dark:text-gray-200">{w.jp}</span>
                              <span className="text-gray-500 dark:text-gray-400">{w.en}</span>
                            </label>
                          ))
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="primary" className="text-sm px-3 py-1.5 bg-green-600 hover:bg-green-700" onClick={saveDeck} disabled={deckSaving}>
                          {t("saveDeck")}
                        </Button>
                        <Button variant="ghost" className="text-sm px-3 py-1.5" onClick={cancelEditDeck}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{deck.name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex-1 ml-2">
                        {deck.vocabIds.length} {t("wordsInDeck")}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => startEditDeck(deck)}
                          className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          aria-label={t("editDeck")}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteDeck(deck.id)}
                          className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          aria-label={t("deleteDeck")}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

      </div>
    </PageContainer>
  );
}
