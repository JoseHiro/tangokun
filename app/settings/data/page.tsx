"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

export default function DataPage() {
  const { data: session } = useSession();

  // Export state
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete state
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<{ type: "error"; text: string } | null>(null);

  const userName = session?.user?.name ?? "";
  const userEmail = session?.user?.email ?? "";
  const deleteEnabled =
    confirmText.trim() === userName || confirmText.trim() === userEmail;

  async function handleExport() {
    setExportMessage(null);
    setExporting(true);
    try {
      const res = await fetch("/api/vocab");
      if (!res.ok) {
        setExportMessage({ type: "error", text: "Failed to fetch vocabulary." });
        return;
      }
      const vocab = await res.json() as Array<{ jp: string; en: string }>;

      // Build CSV
      const rows = [["japanese", "english"], ...vocab.map((v) => [v.jp, v.en])];
      const csv = rows
        .map((row) =>
          row
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tangokun-vocabulary.csv";
      a.click();
      URL.revokeObjectURL(url);
      setExportMessage({ type: "success", text: `${vocab.length} words exported.` });
    } catch {
      setExportMessage({ type: "error", text: "Something went wrong." });
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (!deleteEnabled) return;
    setDeleteMessage(null);
    setDeleting(true);
    try {
      const res = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: confirmText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteMessage({ type: "error", text: data.error ?? "Failed to delete account." });
      } else {
        await signOut({ callbackUrl: "/" });
      }
    } catch {
      setDeleteMessage({ type: "error", text: "Something went wrong." });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Export card */}
      <Card padding="md">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Export Vocabulary
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Download all your vocabulary as a CSV file.
        </p>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-40"
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
          {exportMessage && (
            <p
              className={`text-sm ${
                exportMessage.type === "success"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-500 dark:text-red-400"
              }`}
            >
              {exportMessage.text}
            </p>
          )}
        </div>
      </Card>

      {/* Danger zone card */}
      <Card
        padding="md"
        className="border-red-200 dark:border-red-900"
      >
        <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">
          Delete Account
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          This will permanently delete your account and all your data. This cannot be undone.
        </p>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Type your name or email to confirm
          </label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={userName || userEmail || "Your name or email"}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={!deleteEnabled || deleting}
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 disabled:bg-red-300 dark:disabled:bg-red-900"
          >
            {deleting ? "Deleting…" : "Delete my account"}
          </Button>
          {deleteMessage && (
            <p className="text-sm text-red-500 dark:text-red-400">{deleteMessage.text}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
