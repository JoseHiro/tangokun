"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLearningSettings } from "@/lib/useLearningSettings";
import { useLanguage } from "@/lib/LanguageContext";
import { buttonVariants } from "@/components/ui/button";
import Card from "@/components/ui/card";
import { SakuraFall } from "@/components/SakuraFall";
import { getMasteryConfig, MASTERY_ORDER } from "@/components/ui/mastery-badge";
import type { MasteryState } from "@/features/progress/types";

type MasteryBreakdown = Record<MasteryState, number>;

type DashboardStats = {
  displayName: string;
  dueForReview: number;
  newWordsAvailable: number;
  totalVocab: number;
  accuracy: number;
  streak: number;
  masteryBreakdown: MasteryBreakdown;
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
  const router = useRouter();
  const { newWordsPerDay } = useLearningSettings();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const greeting = useGreeting(stats?.displayName ?? "user", language);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleStudyNow() {
    sessionStorage.setItem("auto_start", "true");
    router.push("/practice");
  }

  const dueForReview = stats?.dueForReview ?? 0;
  const newWords = stats?.newWordsAvailable ?? 0;
  const newToIntroduce = Math.min(newWords, newWordsPerDay);
  const studyCount = dueForReview + newToIntroduce;

  return (
    <>
      <SakuraFall />
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-16 space-y-12">
      {/* ── Hero ── */}
      <section>
        <div className="flex items-center justify-between gap-4 sm:gap-8">
          <div className="space-y-1 min-w-0 flex-1">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
              {greeting}
            </h1>
            <p className="text-lg text-gray-400 dark:text-gray-500 font-light">
              {t("letsUseYourWords")}
            </p>
          </div>
          <div className="shrink-0 w-32 h-32 sm:w-40 sm:h-40 relative">
            <Image
              src="/img/sakura.webp"
              alt=""
              fill
              className="object-contain"
              sizes="(max-width: 640px) 128px, 160px"
              priority
            />
          </div>
        </div>
      </section>

      {/* ── Study Now ── */}
      <section>
        {loading ? (
          <div className="h-36 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ) : (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                {t("studyNowLabel")}
              </p>
              <Link
                href="/help#study-now"
                className="text-xs font-medium text-gray-400 hover:text-green-600 dark:text-gray-500 dark:hover:text-green-400 shrink-0 transition-colors"
              >
                {t("howToUse")}
              </Link>
            </div>
            <div className="flex items-center justify-between gap-6">
              <div className="space-y-1 min-w-0">
                {studyCount === 0 ? (
                  <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                    All caught up! 🎉
                  </p>
                ) : (
                  <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {dueForReview > 0 && (
                      <span>{dueForReview} due for review</span>
                    )}
                    {dueForReview > 0 && newWords > 0 && (
                      <span className="text-gray-300 dark:text-gray-600 mx-2">+</span>
                    )}
                    {newWords > 0 && (
                      <span className="text-violet-600 dark:text-violet-400">
                        {newToIntroduce} new
                      </span>
                    )}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {studyCount * 2} questions · no setup needed
                </p>
              </div>
              {studyCount > 0 && (
                <button
                  onClick={handleStudyNow}
                  className={buttonVariants("primary") + " shrink-0"}
                >
                  Start →
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Stats ── */}
      {!loading && stats && (
        <section className="grid grid-cols-3 gap-4">
          <StatCard label={t("wordsLearned")} value={stats.totalVocab} />
          <StatCard label={t("wordsMastered")} value={stats.masteryBreakdown.mastered} />
          <StatCard label={t("streak")} value={stats.streak} suffix="🔥" />
        </section>
      )}

      {/* ── Mastery Breakdown ── */}
      {!loading && stats && stats.totalVocab > 0 && (
        <section>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
            {t("masteryBreakdown")}
          </p>
          <Card>
            <MasteryBar breakdown={stats.masteryBreakdown} total={stats.totalVocab} t={t as (k: string) => string} />
          </Card>
        </section>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            <div className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            <div className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          </div>
          <div className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        </div>
      )}
      </div>
    </>
  );
}

function StatCard({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  return (
    <Card>
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 truncate">
        {label}
      </p>
      <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
        {value}{suffix && <span className="ml-1 text-2xl">{suffix}</span>}
      </p>
    </Card>
  );
}

function MasteryBar({ breakdown, total, t }: { breakdown: MasteryBreakdown; total: number; t: (k: string) => string }) {
  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-px">
        {MASTERY_ORDER.map((m) => {
          const pct = total > 0 ? (breakdown[m] / total) * 100 : 0;
          if (pct === 0) return null;
          const { dot } = getMasteryConfig(m);
          return (
            <div
              key={m}
              className={`${dot} transition-all`}
              style={{ width: `${pct}%` }}
              title={`${t(`mastery_${m}`)}: ${breakdown[m]}`}
            />
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {MASTERY_ORDER.map((m) => {
          const { text, dot } = getMasteryConfig(m);
          return (
            <div key={m} className={`flex items-center gap-1.5 text-xs ${text}`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
              {t(`mastery_${m}`)} <span className="opacity-60">{breakdown[m]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
