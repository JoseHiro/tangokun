"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/lib/LanguageContext";
import Button, { buttonVariants } from "@/components/ui/button";
import Card from "@/components/ui/card";

type DashboardStats = {
  dueToday: number;
  totalVocab: number;
  accuracy: number;
  wordOfTheDay: {
    jp: string;
    en: string;
    example: string | null;
    exampleTranslation: string | null;
  } | null;
};

function useGreeting(name: string | null | undefined, language: string): string {
  const hour = new Date().getHours();
  if (language === "jp") {
    const time = hour < 12 ? "おはようございます" : hour < 17 ? "こんにちは" : "こんばんは";
    return name ? `${time}、${name} 👋` : `${time} 👋`;
  }
  const time = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return name ? `${time}, ${name} 👋` : `${time} 👋`;
}

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const firstName = session?.user?.name?.split(" ")[0] ?? null;
  const greeting = useGreeting(firstName, language);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const dueMessage =
    !stats || stats.dueToday === 0
      ? t("allCaughtUp")
      : language === "jp"
      ? `${t("dueReviewPrefix")}${stats.dueToday}${t("dueReviewSuffix")}`
      : `${t("dueReviewPrefix")} ${stats.dueToday} ${t("dueReviewSuffix")}`;

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 space-y-12">
      {/* ── Hero ── */}
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
          {greeting}
        </h1>
        <p className="text-lg text-gray-400 dark:text-gray-500 font-light">
          {t("letsUseYourWords")}
        </p>

        {!loading && (
          <p className="text-base text-gray-600 dark:text-gray-400 pt-1">
            {dueMessage}
          </p>
        )}

        <div className="pt-4">
          <Link href="/practice" className={buttonVariants("primary") + " text-sm"}>
            {t("startPractice")}
          </Link>
        </div>
      </section>

      {/* ── Stats ── */}
      {!loading && stats && (
        <section className="grid grid-cols-2 gap-4">
          <StatCard label={t("wordsLearned")} value={stats.totalVocab} />
          <StatCard label={t("accuracy")} value={`${stats.accuracy}%`} />
        </section>
      )}

      {/* ── Word of the Day ── */}
      {!loading && stats?.wordOfTheDay && (
        <section>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
            {t("wordOfTheDay")}
          </p>
          <Card>
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {stats.wordOfTheDay.jp}
                </span>
                <span className="text-base text-gray-400 dark:text-gray-500">
                  {stats.wordOfTheDay.en}
                </span>
              </div>
              {stats.wordOfTheDay.example && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-0.5">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {stats.wordOfTheDay.example}
                  </p>
                  {stats.wordOfTheDay.exampleTranslation && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                      {stats.wordOfTheDay.exampleTranslation}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </section>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            <div className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          </div>
          <div className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </Card>
  );
}
