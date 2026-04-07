import { Modal } from "@/components/ui/modal";
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
    <Modal
      open={true}
      headerTitle="Session info"
      onClose={onClose}
      titleId="session-info-modal-title"
      size="sm"
    >
      <div className="space-y-5">
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
    </Modal>
  );
}
