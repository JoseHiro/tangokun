import Button from "@/components/ui/button";
import { GrammarGroup } from "./GrammarGroup";
import { MasteryBadge } from "@/components/ui/mastery-badge";
import type { Direction, GrammarTab, VocabWord, GrammarItem } from "../_types";
import type { Deck } from "../_hooks/useSetupData";
import type { WordProgressSummary } from "@/app/api/progress/words/route";

interface SetupPhaseProps {
  direction: Direction;
  onDirectionChange: (d: Direction) => void;
  grammarTab: GrammarTab;
  onGrammarTabChange: (t: GrammarTab) => void;
  allVocab: VocabWord[];
  selectedVocabIds: Set<string>;
  vocabLoading: boolean;
  onToggleVocab: (id: string) => void;
  onToggleAllVocab: () => void;
  decks: Deck[];
  decksLoading: boolean;
  selectedDeckId: string | null;
  onDeckChange: (deckId: string | null) => void;
  allGrammar: GrammarItem[];
  selectedGrammarIds: Set<string>;
  grammarLoading: boolean;
  onToggleGrammar: (id: string) => void;
  grammarByJlpt: Record<string, GrammarItem[]>;
  jlptGroups: string[];
  grammarByGenki: Record<string, GrammarItem[]>;
  genkiGroups: string[];
  progressMap: Record<string, WordProgressSummary>;
  onFocusWeak: () => void;
  weakCount: number;
  error: string;
  onStart: () => void;
  t: (key: string) => string;
}

export function SetupPhase({
  direction, onDirectionChange,
  grammarTab, onGrammarTabChange,
  allVocab, selectedVocabIds, vocabLoading, onToggleVocab, onToggleAllVocab,
  decks, decksLoading, selectedDeckId, onDeckChange,
  allGrammar, selectedGrammarIds, grammarLoading, onToggleGrammar,
  grammarByJlpt, jlptGroups, grammarByGenki, genkiGroups,
  progressMap, onFocusWeak, weakCount,
  error, onStart, t,
}: SetupPhaseProps) {
  return (
    <div className="space-y-6">
      {/* Direction */}
      <div>
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
          {t("directionLabel")}
        </p>
        <div className="flex gap-2">
          {(["jp-to-en", "en-to-jp"] as Direction[]).map((d) => (
            <button
              key={d}
              onClick={() => onDirectionChange(d)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                direction === d
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"
              }`}
            >
              {d === "jp-to-en" ? t("jpToEn") : t("enToJp")}
            </button>
          ))}
        </div>
      </div>

      {/* Deck */}
      {!decksLoading && decks.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
            {t("useDeck")}
          </p>
          <select
            value={selectedDeckId ?? ""}
            onChange={(e) => onDeckChange(e.target.value || null)}
            className="w-full max-w-xs px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          >
            <option value="">{t("deckNone")}</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name} ({deck.vocabIds.length})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Vocabulary */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            {t("selectVocab")}
          </p>
          {allVocab.length > 0 && (
            <div className="flex items-center gap-3">
              {weakCount > 0 && (
                <button
                  onClick={onFocusWeak}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                >
                  {t("focusWeak")} ({weakCount} {t("focusWeakDesc")})
                </button>
              )}
              <button
                onClick={onToggleAllVocab}
                className="text-xs text-green-600 dark:text-green-400 hover:underline"
              >
                {selectedVocabIds.size === allVocab.length ? t("deselectAll") : t("selectAll")}
              </button>
            </div>
          )}
        </div>
        {vocabLoading ? (
          <p className="text-sm text-gray-400 animate-pulse">{t("loading")}</p>
        ) : allVocab.length === 0 ? (
          <p className="text-sm text-gray-400">{t("noWords")}</p>
        ) : (
          <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
            {allVocab.map((w) => (
              <label
                key={w.id}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedVocabIds.has(w.id)}
                  onChange={() => onToggleVocab(w.id)}
                  className="accent-green-600 w-4 h-4 shrink-0"
                />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{w.jp}</span>
                <span className="text-sm text-gray-400 dark:text-gray-500 flex-1">{w.en}</span>
                <MasteryBadge mastery={progressMap[w.id]?.mastery ?? "new"} variant="dot" />
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Grammar */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            {t("selectGrammar")}
          </p>
          <span className="text-xs text-gray-300 dark:text-gray-600">({t("grammarOptional")})</span>
        </div>
        <div className="flex gap-1 mb-3 border-b border-gray-100 dark:border-gray-800">
          {(["jlpt", "genki"] as GrammarTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => onGrammarTabChange(tab)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                grammarTab === tab
                  ? "border-green-500 text-green-600 dark:text-green-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {tab === "jlpt" ? t("byJlptLevel") : t("byGenkiChapter")}
            </button>
          ))}
        </div>
        {grammarLoading ? (
          <p className="text-sm text-gray-400 animate-pulse">{t("loading")}</p>
        ) : grammarTab === "jlpt" ? (
          jlptGroups.length === 0 ? (
            <p className="text-sm text-gray-400">{t("noGrammarLoaded")}</p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {jlptGroups.map((level) => (
                <GrammarGroup
                  key={level}
                  label={level}
                  items={grammarByJlpt[level]}
                  selectedIds={selectedGrammarIds}
                  onToggle={onToggleGrammar}
                />
              ))}
            </div>
          )
        ) : genkiGroups.length === 0 ? (
          <p className="text-sm text-gray-400">{t("noGrammarForTab")}</p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {genkiGroups.map((src) => (
              <GrammarGroup
                key={src}
                label={src}
                items={grammarByGenki[src]}
                selectedIds={selectedGrammarIds}
                onToggle={onToggleGrammar}
              />
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button
        variant="primary"
        onClick={onStart}
        disabled={selectedVocabIds.size === 0}
      >
        {t("startPractice")}
      </Button>
    </div>
  );
}
