import Button from "@/components/ui/button";
import { ProgressBar } from "./ProgressBar";
import type { SessionQuestion, QuestionResult } from "../_types";

interface FinishedPhaseProps {
  session: SessionQuestion[];
  results: (QuestionResult | null)[];
  onPracticeAgain: () => void;
  onBackToSetup: () => void;
  t: (key: string) => string;
}

export function FinishedPhase({ session, results, onPracticeAgain, onBackToSetup, t }: FinishedPhaseProps) {
  const totalCorrect = results.filter((r) => r?.correct).length;
  const pct = Math.round((totalCorrect / Math.max(session.length, 1)) * 100);

  const wordSummary = (() => {
    const map = new Map<string, { word: SessionQuestion["wordUsed"]; results: (QuestionResult | null)[] }>();
    session.forEach((q, i) => {
      const key = q.wordUsed.id;
      if (!map.has(key)) map.set(key, { word: q.wordUsed, results: [] });
      map.get(key)!.results.push(results[i] ?? null);
    });
    return Array.from(map.values());
  })();

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <p className="text-5xl font-bold text-gray-900 dark:text-gray-100">
          {totalCorrect}
          <span className="text-2xl font-normal text-gray-400 dark:text-gray-500"> / {session.length}</span>
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{pct}% correct</p>
        <div className="max-w-xs mx-auto">
          <ProgressBar value={totalCorrect} total={session.length} color="score" />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
          {t("wordBreakdown")}
        </p>
        <div className="rounded-lg border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {wordSummary.map(({ word, results: wResults }) => (
            <div key={word.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{word.jp}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{word.en}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {wResults.map((r, i) => (
                  <span
                    key={i}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      r?.correct
                        ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                        : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {r?.correct ? "✓" : "✗"}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="primary" onClick={onPracticeAgain}>{t("practiceAgain")}</Button>
        <Button variant="ghost" onClick={onBackToSetup}>{t("backToSetup")}</Button>
      </div>
    </div>
  );
}
