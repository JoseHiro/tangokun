"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import PageContainer from "@/components/layout/page-container";
import Card from "@/components/ui/card";

type ProgressStats = {
  totalVocab: number;
  totalCorrect: number;
  totalWrong: number;
  accuracy: number;
  todayCount: number;
  dueToday: number;
};

export default function ProgressPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <PageContainer title={t("progressTitle")} subtitle={t("progressSubtitle")}>
      {loading ? (
        <p className="text-sm text-gray-400">{t("loading")}</p>
      ) : stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label={t("totalVocab")} value={stats.totalVocab} />
          <StatCard label={t("correctAnswers")} value={stats.totalCorrect} />
          <StatCard label={t("accuracy")} value={`${stats.accuracy}%`} />
          <StatCard label={t("todayCount")} value={stats.todayCount} />
          <StatCard label={t("dueToday")} value={stats.dueToday} />
        </div>
      ) : null}
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
