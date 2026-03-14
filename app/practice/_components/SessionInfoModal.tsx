import type { VocabWord, GrammarItem, Direction } from "../_types";

interface SessionInfoModalProps {
  allVocab: VocabWord[];
  selectedVocabIds: Set<string>;
  allGrammar: GrammarItem[];
  selectedGrammarIds: Set<string>;
  direction: Direction;
  onClose: () => void;
  t: (key: string) => string;
}

export function SessionInfoModal({
  allVocab, selectedVocabIds,
  allGrammar, selectedGrammarIds,
  direction, onClose, t,
}: SessionInfoModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative z-10 w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Session info</p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
              {t("selectVocab")} · {allVocab.filter((w) => selectedVocabIds.has(w.id)).length}
            </p>
            <div className="flex flex-wrap gap-2">
              {allVocab
                .filter((w) => selectedVocabIds.has(w.id))
                .map((w) => (
                  <span
                    key={w.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 dark:bg-gray-800 text-sm"
                  >
                    <span className="font-medium text-gray-800 dark:text-gray-200">{w.jp}</span>
                    <span className="text-gray-400 dark:text-gray-500">{w.en}</span>
                  </span>
                ))}
            </div>
          </div>

          {selectedGrammarIds.size > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                {t("grammarLabel")} · {selectedGrammarIds.size}
              </p>
              <div className="flex flex-wrap gap-2">
                {allGrammar
                  .filter((g) => selectedGrammarIds.has(g.id))
                  .map((g) => (
                    <span
                      key={g.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 text-sm"
                    >
                      <span className="font-semibold text-green-800 dark:text-green-300">{g.pattern}</span>
                      <span className="text-green-600 dark:text-green-500">{g.meaning}</span>
                    </span>
                  ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
              {t("directionLabel")}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {direction === "jp-to-en" ? t("jpToEn") : t("enToJp")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
