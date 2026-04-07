"use client";

import Card from "@/components/ui/card";
import { useLearningSettings } from "@/lib/useLearningSettings";

const PRESETS = [3, 5, 10, 15, 20];

export default function LearningSettingsPage() {
  const { newWordsPerDay, updateNewWordsPerDay } = useLearningSettings();

  return (
    <div className="space-y-4">
      <Card padding="md">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Daily new words
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          How many new words to introduce per Study Now session. Due reviews are always included on top of this.
        </p>

        {/* Preset buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESETS.map((n) => (
            <button
              key={n}
              onClick={() => updateNewWordsPerDay(n)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                newWordsPerDay === n
                  ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
            Custom:
          </label>
          <input
            type="number"
            min={1}
            max={30}
            value={newWordsPerDay}
            onChange={(e) => updateNewWordsPerDay(Number(e.target.value))}
            className="w-20 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <span className="text-sm text-gray-400 dark:text-gray-500">words / day</span>
        </div>

        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          Each word generates 2 practice questions. {newWordsPerDay} new words = {newWordsPerDay * 2} new questions per session.
        </p>
      </Card>
    </div>
  );
}
