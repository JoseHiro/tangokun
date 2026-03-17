"use client";

import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import PageContainer from "@/components/layout/page-container";
import Card from "@/components/ui/card";
import { MasteryBadge, MASTERY_ORDER } from "@/components/ui/mastery-badge";
import type { MasteryState } from "@/features/progress/types";
import type { WordProgressSummary } from "@/app/api/progress/words/route";

type ProgressStats = {
  totalVocab: number;
  totalCorrect: number;
  totalWrong: number;
  accuracy: number;
  todayCount: number;
  dueToday: number;
};

type VocabWord = { id: string; jp: string; en: string };

type WordRow = VocabWord & {
  mastery: MasteryState;
  lifetimeAttempts: number;
  lifetimeCorrect: number;
  accuracy: number | null;
  lastSeen: string | null;
};

export default function ProgressPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [words, setWords] = useState<WordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [masteryFilter, setMasteryFilter] = useState<MasteryState | "all">("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/progress").then((r) => r.json()),
      fetch("/api/vocab").then((r) => r.json()),
      fetch("/api/progress/words").then((r) => r.json()),
    ])
      .then(([statsData, vocabData, progressData]: [ProgressStats, VocabWord[], WordProgressSummary[]]) => {
        setStats(statsData);
        const progressMap: Record<string, WordProgressSummary> = {};
        if (Array.isArray(progressData)) {
          progressData.forEach((p) => { progressMap[p.wordId] = p; });
        }
        const rows: WordRow[] = Array.isArray(vocabData)
          ? vocabData.map((w) => {
              const p = progressMap[w.id];
              return {
                ...w,
                mastery: p?.mastery ?? "new",
                lifetimeAttempts: p?.lifetimeAttempts ?? 0,
                lifetimeCorrect: p?.lifetimeCorrect ?? 0,
                accuracy: p && p.lifetimeAttempts > 0
                  ? Math.round((p.lifetimeCorrect / p.lifetimeAttempts) * 100)
                  : null,
                lastSeen: p?.lastSeen ?? null,
              };
            })
          : [];
        // Sort: mastery order (new first), then by accuracy asc (worst first)
        rows.sort((a, b) => {
          const mi = MASTERY_ORDER.indexOf(a.mastery) - MASTERY_ORDER.indexOf(b.mastery);
          if (mi !== 0) return mi;
          if (a.accuracy === null) return -1;
          if (b.accuracy === null) return 1;
          return a.accuracy - b.accuracy;
        });
        setWords(rows);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() =>
    masteryFilter === "all" ? words : words.filter((w) => w.mastery === masteryFilter),
    [words, masteryFilter],
  );

  return (
    <PageContainer title={t("progressTitle")} subtitle={t("progressSubtitle")}>
      <div className="space-y-8">
        {/* ── Summary stats ── */}
        {!loading && stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard label={t("totalVocab")} value={stats.totalVocab} />
            <StatCard label={t("correctAnswers")} value={stats.totalCorrect} />
            <StatCard label={t("accuracy")} value={`${stats.accuracy}%`} />
            <StatCard label={t("todayCount")} value={stats.todayCount} />
            <StatCard label={t("dueToday")} value={stats.dueToday} />
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        )}

        {/* ── Per-word list ── */}
        {!loading && words.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                {t("wordBreakdown")}
              </p>
              <select
                value={masteryFilter}
                onChange={(e) => setMasteryFilter(e.target.value as MasteryState | "all")}
                className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
              >
                <option value="all">{t("allLevels")}</option>
                {MASTERY_ORDER.map((m) => (
                  <option key={m} value={m}>{t(`mastery_${m}`)}</option>
                ))}
              </select>
            </div>
            <Card className="!p-0 overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((w) => (
                  <div key={w.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{w.jp}</span>
                      <span className="text-gray-400 dark:text-gray-500 text-sm ml-2">{w.en}</span>
                    </div>
                    <MasteryBadge mastery={w.mastery} variant="pill" />
                    <div className="text-right text-xs text-gray-400 dark:text-gray-500 shrink-0 w-16">
                      {w.accuracy !== null ? `${w.accuracy}%` : "—"}
                    </div>
                    <div className="text-right text-xs text-gray-400 dark:text-gray-500 shrink-0 w-20 hidden sm:block">
                      {w.lastSeen
                        ? new Date(w.lastSeen).toLocaleDateString()
                        : t("neverPracticed")}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        )}
      </div>
    </PageContainer>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </Card>
  );
}
