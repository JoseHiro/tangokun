"use client";

import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import PageContainer from "@/components/layout/page-container";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/table";

type Word = { id: string; jp: string; en: string; createdAt: string };

type ImportStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; imported: number; skipped: number }
  | { state: "error"; message: string };

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

  async function fetchWords() {
    const res = await fetch("/api/vocab");
    const data = await res.json();
    setWords(Array.isArray(data) ? data : []);
    setFetching(false);
  }

  useEffect(() => {
    fetchWords();
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
