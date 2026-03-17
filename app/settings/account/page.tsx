"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

export default function AccountPage() {
  const { data: session } = useSession();

  // Email state
  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleEmailSave() {
    setEmailMessage(null);
    setEmailSaving(true);
    try {
      const res = await fetch("/api/user/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailMessage({ type: "error", text: data.error ?? "Failed to update email" });
      } else {
        setEmailMessage({ type: "success", text: "Email updated. Please sign out and back in for it to take full effect." });
        setNewEmail("");
      }
    } catch {
      setEmailMessage({ type: "error", text: "Something went wrong." });
    } finally {
      setEmailSaving(false);
    }
  }

  async function handlePasswordSave() {
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "no password") {
          setPasswordMessage({
            type: "error",
            text: "Your account uses Google sign-in. Password change is not available.",
          });
        } else {
          setPasswordMessage({ type: "error", text: data.error ?? "Failed to update password" });
        }
      } else {
        setPasswordMessage({ type: "success", text: "Password updated." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordMessage({ type: "error", text: "Something went wrong." });
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Email card */}
      <Card padding="md">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Email</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Update your account email address.
        </p>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Current email
          </label>
          <p className="text-sm text-gray-900 dark:text-gray-100 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {session?.user?.email ?? "—"}
          </p>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            New email
          </label>
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="new@email.com"
          />
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Email change requires signing out and back in to take full effect.
        </p>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleEmailSave}
            disabled={emailSaving || !newEmail}
            className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-40"
          >
            {emailSaving ? "Saving…" : "Update email"}
          </Button>
          {emailMessage && (
            <p
              className={`text-sm ${
                emailMessage.type === "success"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-500 dark:text-red-400"
              }`}
            >
              {emailMessage.text}
            </p>
          )}
        </div>
      </Card>

      {/* Password card */}
      <Card padding="md">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Password</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Change your account password.
        </p>

        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Current password
            </label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              New password
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Confirm new password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handlePasswordSave}
            disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
            className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-40"
          >
            {passwordSaving ? "Saving…" : "Change password"}
          </Button>
          {passwordMessage && (
            <p
              className={`text-sm ${
                passwordMessage.type === "success"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-500 dark:text-red-400"
              }`}
            >
              {passwordMessage.text}
            </p>
          )}
        </div>
      </Card>

      {/* Connected accounts card */}
      <Card padding="md">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Connected accounts
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          External providers linked to your account.
        </p>

        <div className="flex items-center gap-3">
          {/* Google G icon */}
          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
            <span
              className="text-sm font-bold"
              style={{
                background: "linear-gradient(135deg, #4285F4 25%, #34A853 50%, #FBBC05 75%, #EA4335 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              G
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Google</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {session?.user?.image ? "Connected" : "Not connected"}
            </p>
          </div>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              session?.user?.image
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            }`}
          >
            {session?.user?.image ? "Connected" : "Not connected"}
          </span>
        </div>
      </Card>
    </div>
  );
}
