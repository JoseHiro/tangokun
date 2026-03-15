"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Pencil, Trash2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import PageContainer from "@/components/layout/page-container";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/table";

type Word = { id: string; jp: string; en: string; createdAt: string };

type Deck = { id: string; name: string; vocabIds: string[] };

type ImportStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; imported: number; skipped: number }
  | { state: "error"; message: string };

const MAX_DECKS = 5;

export default function VocabPage() {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [words, setWords] = useState<Word[]>([]);
  const [jp, setJp] = useState("");
  const [en, setEn] = useState("");
  const [adding, setAdding] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [importStatus, setImportStatus] = useState<ImportStatus>({ state: "idle" });
  const [isDragging, setIsDragging] = useState(false);

  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckFetching, setDeckFetching] = useState(true);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editVocabIds, setEditVocabIds] = useState<Set<string>>(new Set());
  const [deckSaving, setDeckSaving] = useState(false);

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

  useEffect(() => {
    fetchWords();
  }, []);

  useEffect(() => {
    fetchDecks();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!jp.trim() || !en.trim()) return;
    setAdding(true);
    await fetch("/api/vocab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jp: jp.trim(), en: en.trim() }),
    });
    setJp("");
    setEn("");
    await fetchWords();
    setAdding(false);
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
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImportFile(file);
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
    setDecks((prev) => prev.map((d) => (d.id === updated.id ? { ...d, name: updated.name, vocabIds: Array.isArray(updated.vocabIds) ? updated.vocabIds : [] } : d)));
    setEditingDeckId(null);
  }

  async function deleteDeck(id: string) {
    if (!confirm(t("deleteDeck") + "?")) return;
    const res = await fetch(`/api/decks/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setDecks((prev) => prev.filter((d) => d.id !== id));
    if (editingDeckId === id) setEditingDeckId(null);
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
      <div className="space-y-8">
        {/* Add word form */}
        <Card padding="md">
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
            <Input
              type="text"
              placeholder={t("placeholderJp")}
              value={jp}
              onChange={(e) => setJp(e.target.value)}
            />
            <Input
              type="text"
              placeholder={t("placeholderEn")}
              value={en}
              onChange={(e) => setEn(e.target.value)}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={adding || !jp.trim() || !en.trim()}
              className="shrink-0"
            >
              {t("addWord")}
            </Button>
          </form>
        </Card>

        {/* CSV import */}
        <Card padding="md">
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
            className={`flex flex-col items-center justify-center gap-3 py-8 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
              isDragging
                ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                : "border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-700 hover:bg-gray-50 dark:hover:bg-gray-900/40"
            }`}
          >
            <Upload
              size={20}
              className={isDragging ? "text-green-500" : "text-gray-400 dark:text-gray-500"}
            />
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {importStatus.state === "loading" ? t("importing") : t("importCSV")}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{t("importDropLabel")}</p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5 font-mono">{t("importFormat")}</p>
            </div>
          </div>

          {importStatus.state === "success" && (
            <p className="mt-3 text-sm text-green-600 dark:text-green-400">
              {importStatus.imported} {t("importSuccess")}
              {importStatus.skipped > 0 && (
                <span className="text-gray-400 dark:text-gray-500 ml-2">
                  ({importStatus.skipped} {t("importSkipped")})
                </span>
              )}
            </p>
          )}
          {importStatus.state === "error" && (
            <p className="mt-3 text-sm text-red-500">{importStatus.message}</p>
          )}
        </Card>

        {/* Decks */}
        <Card padding="md">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {t("decks")}
            </h2>
            <Button
              variant="secondary"
              size="sm"
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
            <p className="text-sm text-gray-400 dark:text-gray-500">{t("loading")}</p>
          ) : decks.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {t("createDeck")} to group words for practice.
            </p>
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("selectWordsForDeck")}
                      </p>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                        {words.length === 0 ? (
                          <p className="text-xs text-gray-400">{t("noWords")}</p>
                        ) : (
                          words.map((w) => (
                            <label
                              key={w.id}
                              className="flex items-center gap-2 cursor-pointer text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={editVocabIds.has(w.id)}
                                onChange={() => toggleEditVocab(w.id)}
                                className="rounded border-gray-300 dark:border-gray-600"
                              />
                              <span className="font-medium text-gray-800 dark:text-gray-200">
                                {w.jp}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">{w.en}</span>
                            </label>
                          ))
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={saveDeck}
                          disabled={deckSaving}
                        >
                          {t("saveDeck")}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={cancelEditDeck}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {deck.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
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

        {/* Word list */}
        {fetching ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">{t("loading")}</p>
        ) : words.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">{t("noWords")}</p>
        ) : (
          <Table>
            <TableHead>
              <tr>
                <Th>{t("colJapanese")}</Th>
                <Th>{t("colEnglish")}</Th>
                <Th className="w-16" />
              </tr>
            </TableHead>
            <TableBody>
              {words.map((word) => (
                <TableRow key={word.id}>
                  <Td className="font-medium text-base">{word.jp}</Td>
                  <Td className="text-gray-500 dark:text-gray-400">{word.en}</Td>
                  <Td className="text-right">
                    <Button
                      variant="danger"
                      className="px-2 py-1 text-xs opacity-0 group-hover:opacity-100"
                      onClick={() => handleDelete(word.id)}
                    >
                      {t("removeWord")}
                    </Button>
                  </Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </PageContainer>
  );
}
