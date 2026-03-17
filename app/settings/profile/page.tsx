"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Keep name in sync if session loads after mount
  const sessionName = session?.user?.name ?? "";
  if (name === "" && sessionName !== "") {
    setName(sessionName);
  }

  const initials = sessionName
    ? sessionName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  async function handleSave() {
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to save" });
      } else {
        await update({ name: data.name });
        setMessage({ type: "success", text: "Profile updated." });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card padding="md">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Profile</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Update your display name.
        </p>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt={sessionName || "User"}
              width={48}
              height={48}
              className="rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
              <span className="text-base font-semibold text-green-700 dark:text-green-400">
                {initials}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {sessionName || "—"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {session?.user?.email ?? ""}
            </p>
          </div>
        </div>

        {/* Email (read-only) */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Email
          </label>
          <p className="text-sm text-gray-900 dark:text-gray-100 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {session?.user?.email ?? "—"}
          </p>
        </div>

        {/* Name input */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            placeholder="Your name"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
          {message && (
            <p
              className={`text-sm ${
                message.type === "success"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-500 dark:text-red-400"
              }`}
            >
              {message.text}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
