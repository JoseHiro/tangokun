import type { MasteryState } from "@/features/progress/types";

const CONFIG: Record<MasteryState, { label: string; dot: string; text: string; bg: string }> = {
  new:      { label: "New",      dot: "bg-gray-300 dark:bg-gray-600",   text: "text-gray-500 dark:text-gray-400",     bg: "bg-gray-100 dark:bg-gray-800" },
  learning: { label: "Learning", dot: "bg-amber-400",                   text: "text-amber-700 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-900/20" },
  familiar: { label: "Familiar", dot: "bg-blue-400",                    text: "text-blue-700 dark:text-blue-400",     bg: "bg-blue-50 dark:bg-blue-900/20" },
  strong:   { label: "Strong",   dot: "bg-green-400",                   text: "text-green-700 dark:text-green-400",   bg: "bg-green-50 dark:bg-green-900/20" },
  mastered: { label: "Mastered", dot: "bg-violet-400",                  text: "text-violet-700 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20" },
};

type Props = {
  mastery: MasteryState;
  /** pill renders with a background chip; dot renders inline dot+text only */
  variant?: "pill" | "dot";
};

export function MasteryBadge({ mastery, variant = "dot" }: Props) {
  const { label, dot, text, bg } = CONFIG[mastery];

  if (variant === "pill") {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
        {label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${text}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      {label}
    </span>
  );
}

/** Returns just the color config for a mastery state — useful for building custom UIs */
export function getMasteryConfig(mastery: MasteryState) {
  return CONFIG[mastery];
}

export const MASTERY_ORDER: MasteryState[] = ["new", "learning", "familiar", "strong", "mastered"];
