"use client";

import { useEffect } from "react";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { inputClassName } from "@/components/ui/input";
import AudioWaveform from "@/components/AudioWaveform";
import { ProgressBar } from "./ProgressBar";
import type { SessionQuestion, QuestionResult, InputMode } from "../_types";

interface PracticingPhaseProps {
  session: SessionQuestion[];
  currentIdx: number;
  audioUrls: Map<string, string>;
  currentJudge: QuestionResult | null;
  judging: boolean;
  answer: string;
  setAnswer: (a: string) => void;
  inputMode: InputMode;
  setInputMode: (m: InputMode) => void;
  isRecording: boolean;
  showHint: boolean;
  setShowHint: (v: boolean) => void;
  showSentence: boolean;
  setShowSentence: (v: boolean) => void;
  onShowSessionInfo: () => void;
  isEnToJp: boolean;
  onNext: () => void;
  onBackToSetup: () => void;
  handleJudge: (ans: string) => void;
  handleTextSubmit: (e: React.SyntheticEvent) => void;
  handleRecordStart: () => void;
  handleRecordEnd: () => void;
  t: (key: string) => string;
}

export function PracticingPhase({
  session, currentIdx, audioUrls,
  currentJudge, judging,
  answer, setAnswer, inputMode, setInputMode, isRecording,
  showHint, setShowHint, showSentence, setShowSentence,
  onShowSessionInfo, isEnToJp,
  onNext, onBackToSetup,
  handleJudge, handleTextSubmit, handleRecordStart, handleRecordEnd,
  t,
}: PracticingPhaseProps) {
  const currentQ = session[currentIdx];
  const currentAudio = currentQ ? (audioUrls.get(currentQ.id) ?? null) : null;
  const promptText = currentQ
    ? isEnToJp ? currentQ.translation : currentQ.sentence
    : "";

  // Hold Enter to record
  useEffect(() => {
    if (inputMode !== "voice" || currentJudge) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Enter" || e.repeat) return;
      e.preventDefault();
      handleRecordStart();
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      handleRecordEnd();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [inputMode, currentJudge]); // eslint-disable-line react-hooks/exhaustive-deps

  // Space/Enter to advance when judged
  useEffect(() => {
    if (!currentJudge) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onNext();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [currentJudge]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentQ) return null;

  return (
    <div className="flex flex-col gap-5 min-h-[60vh]">
      {/* Progress header */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>
            {t("questionLabel")} {currentIdx + 1} / {session.length}
          </span>
          <button
            onClick={onShowSessionInfo}
            className="flex items-center gap-1 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            Session info
          </button>
        </div>
        <ProgressBar value={currentIdx + (currentJudge ? 1 : 0)} total={session.length} />
      </div>

      {/* Question card */}
      <Card>
        {currentAudio ? (
          <div className="mb-4">
            <AudioWaveform audioUrl={currentAudio} autoPlay={!isEnToJp} />
          </div>
        ) : (
          <div className="flex items-center gap-3 h-10 mb-4">
            <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 animate-pulse shrink-0" />
            <div className="flex-1 h-2 bg-violet-100 dark:bg-violet-900/20 animate-pulse rounded-full" />
          </div>
        )}

        {showSentence || currentJudge ? (
          <div className="mb-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-2xl text-gray-900 dark:text-gray-100 leading-relaxed">{promptText}</p>
              {!currentJudge && (
                <button
                  onClick={() => { setShowSentence(false); setShowHint(false); }}
                  className="shrink-0 mt-1 text-xs text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 transition-colors"
                >
                  {t("hideSentence")}
                </button>
              )}
            </div>
            {!isEnToJp &&
              (showHint ? (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">{currentQ.furigana}</p>
                  <button
                    onClick={() => setShowHint(false)}
                    className="text-xs text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 transition-colors shrink-0"
                  >
                    {t("hideReading")}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowHint(true)}
                  className="mt-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {t("showReading")}
                </button>
              ))}
          </div>
        ) : (
          <button
            onClick={() => setShowSentence(true)}
            className="mb-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors underline underline-offset-2"
          >
            {t("showSentence")}
          </button>
        )}
      </Card>

      {/* Result panel */}
      {currentJudge && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border ${
            currentJudge.correct
              ? "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900"
              : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900"
          }`}
        >
          <span className={`text-2xl leading-none mt-0.5 ${currentJudge.correct ? "text-green-600" : "text-red-500"}`}>
            {currentJudge.correct ? "✓" : "✗"}
          </span>
          <div className="space-y-1 flex-1">
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">{currentJudge.answer}</p>
            {!currentJudge.correct && currentJudge.feedback && (
              <p className="text-sm text-red-700 dark:text-red-400">{currentJudge.feedback}</p>
            )}
            {!currentJudge.correct && (
              <p className="text-sm text-gray-700 dark:text-gray-200">
                <span className="font-medium">{t("correctTranslation")}</span>{" "}
                {currentJudge.correctTranslation}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Input / Next */}
      <div>
        {!currentJudge ? (
          inputMode === "voice" ? (
            <div className="flex flex-col items-center gap-5 py-6">
              {judging ? (
                <p className="text-sm text-gray-400 animate-pulse">{t("checking")}</p>
              ) : (
                <div className="relative flex items-center justify-center">
                  {isRecording && (
                    <span
                      className="absolute inset-0 rounded-full bg-red-400/40 dark:bg-red-500/30 animate-ping"
                      style={{ animationDuration: "1.2s" }}
                      aria-hidden
                    />
                  )}
                  <button
                    onPointerDown={handleRecordStart}
                    onPointerUp={handleRecordEnd}
                    onPointerLeave={handleRecordEnd}
                    disabled={judging}
                    className={`relative flex items-center justify-center rounded-full transition-all duration-200 select-none touch-none outline-none focus-visible:ring-4 focus-visible:ring-gray-400 dark:focus-visible:ring-gray-700 focus-visible:ring-offset-4 ${
                      isRecording
                        ? "w-24 h-24 bg-red-500 shadow-lg shadow-red-500/40 dark:shadow-red-900/50 scale-105 ring-4 ring-red-400/50 dark:ring-red-500/40"
                        : "w-24 h-24 bg-black hover:bg-gray-800 active:scale-95 shadow-lg shadow-black/40 dark:shadow-black/60 hover:shadow-black/50 ring-4 ring-gray-800/40 dark:ring-gray-700/50 hover:ring-gray-700/50"
                    }`}
                    aria-label={isRecording ? "Recording…" : "Hold to speak"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={32}
                      height={32}
                      viewBox="0 0 24 24"
                      fill="white"
                      className={isRecording ? "drop-shadow-sm" : ""}
                      aria-hidden
                    >
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                  </button>
                </div>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 select-none text-center max-w-[240px]">
                {isRecording ? (
                  <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    {t("listening")}
                  </span>
                ) : (
                  t("holdToSpeak")
                )}
              </p>
              <div className="flex items-center gap-3">
                <Button variant="ghost" className="text-xs px-2 py-1" onClick={onBackToSetup}>
                  {t("backToSetup")}
                </Button>
                <span className="text-gray-300 dark:text-gray-700">|</span>
                <button
                  onClick={() => setInputMode("text")}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  Use keyboard
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleTextSubmit} className="space-y-3">
              <textarea
                autoFocus
                placeholder={isEnToJp ? t("answerPlaceholderJp") : t("answerPlaceholder")}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || e.shiftKey) return;
                  e.preventDefault();
                  if (!e.repeat && answer.trim()) handleTextSubmit(e);
                }}
                rows={3}
                className={`${inputClassName} resize-none`}
              />
              <div className="flex items-center gap-2 flex-wrap">
                <Button type="submit" variant="primary" disabled={judging || !answer.trim()}>
                  {judging ? t("checking") : t("checkAnswer")}
                </Button>
                <Button type="button" variant="ghost" onClick={onBackToSetup}>
                  {t("backToSetup")}
                </Button>
                <button
                  type="button"
                  onClick={() => setInputMode("voice")}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-auto"
                >
                  Use voice
                </button>
              </div>
            </form>
          )
        ) : (
          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={onNext}>
              {currentIdx + 1 >= session.length ? t("sessionComplete") : `${t("next")} →`}
            </Button>
            <p className="text-xs text-gray-400 dark:text-gray-500 select-none">Press Space or Enter</p>
          </div>
        )}
      </div>
    </div>
  );
}
