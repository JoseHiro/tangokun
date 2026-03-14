import { Spinner } from "./Spinner";
import { ProgressBar } from "./ProgressBar";

interface LoadingPhaseProps {
  loadingStep: "questions" | "audio";
  audioLoadedCount: number;
  sessionLength: number;
  t: (key: string) => string;
}

export function LoadingPhase({ loadingStep, audioLoadedCount, sessionLength, t }: LoadingPhaseProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      {loadingStep === "questions" ? (
        <>
          <Spinner />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("generatingSession")}</p>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("loadingAudio")} — {audioLoadedCount} / {sessionLength}
          </p>
          <div className="w-full max-w-xs">
            <ProgressBar value={audioLoadedCount} total={sessionLength} />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {Math.round((audioLoadedCount / Math.max(sessionLength, 1)) * 100)}%
          </p>
        </>
      )}
    </div>
  );
}
