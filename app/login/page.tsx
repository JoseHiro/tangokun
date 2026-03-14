"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

export default function LoginPage() {
  const { t } = useLanguage();
  const { status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") router.push("/");
  }, [status, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email: email.trim(),
      redirect: false,
    });
    if (result?.error) {
      setError("Login failed. Please try again.");
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  if (status === "loading") return null;

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t("loginTitle")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("loginSubtitle")}</p>
        </div>

        <Card>
          <form onSubmit={handleLogin} className="space-y-3">
            <Input
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center"
              disabled={loading || !email.trim()}
            >
              {loading ? "..." : t("signIn")}
            </Button>
          </form>

          {/* Placeholder for future OAuth providers */}
          {/* <Button variant="secondary" className="w-full justify-center gap-2 mt-2">
            <GoogleIcon /> {t("continueWithGoogle")}
          </Button> */}
        </Card>
      </div>
    </div>
  );
}
