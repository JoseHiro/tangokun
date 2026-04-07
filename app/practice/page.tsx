"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import PageContainer from "@/components/layout/page-container";
import { useSetupData } from "./_hooks/useSetupData";
import { useSession } from "./_hooks/useSession";
import { usePractice } from "./_hooks/usePractice";
import { SetupPhase } from "./_components/SetupPhase";
import { LoadingPhase } from "./_components/LoadingPhase";
import { PracticingPhase } from "./_components/PracticingPhase";
import { FinishedPhase } from "./_components/FinishedPhase";
import { SessionInfoModal } from "./_components/SessionInfoModal";
import type { WordProgressSummary } from "@/app/api/progress/words/route";

export default function PracticePage() {
  const { t: tTyped } = useLanguage();
  const t = tTyped as (key: string) => string;
  const setup = useSetupData();
  const session = useSession();
  const practice = usePractice(setup.direction);
  const [updatedProgressMap, setUpdatedProgressMap] = useState<Record<string, WordProgressSummary> | null>(null);
  const [todayCount, setTodayCount] = useState<number | null>(null);

  const isEnToJp = setup.direction === "en-to-jp";

  async function handleStartSession(vocabOverride?: Set<string>) {
    const questions = await session.startSession({
      direction: setup.direction,
      selectedVocabIds: vocabOverride ?? setup.selectedVocabIds,
      selectedGrammarIds: setup.selectedGrammarIds,
    });
    if (questions) practice.reset(questions);
  }

  // Auto-start when navigated from dashboard "Study Now"
  const autoStarted = useRef(false);
  useEffect(() => {
    if (autoStarted.current || setup.vocabLoading || setup.progressLoading) return;
    if (typeof window === "undefined") return;
    const flag = sessionStorage.getItem("auto_start");
    if (flag !== "true") return;
    sessionStorage.removeItem("auto_start");
    autoStarted.current = true;
    const ids = setup.autoSelectForStudy();
    if (ids.size > 0) handleStartSession(ids);
  }, [setup.vocabLoading, setup.progressLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePracticeMistakes(wrongWordIds: string[]) {
    setUpdatedProgressMap(null);
    setTodayCount(null);
    await handleStartSession(new Set(wrongWordIds));
  }

  function handleBackToSetup() {
    practice.reset([]);
    session.resetSession();
  }

  async function handleNext() {
    if (practice.isLastQuestion) {
      session.setPhase("finished");
      new Audio("/mp3/Duolingo_like,_finis_%233-1774009764406.mp3").play().catch(() => {});
      const sessionResults = practice.getSessionResults();
      const progressResults = session.session.map((q, i) => ({
        wordId: q.wordUsed.id,
        correct: sessionResults[i]?.correct ?? false,
      }));
      fetch("/api/progress/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results: progressResults }),
      })
        .then((r) => r.json())
        .then((data: { ok: boolean; todayCount: number }) => {
          setTodayCount(data.todayCount ?? null);
          return fetch("/api/progress/words");
        })
        .then((r) => r.json())
        .then((data: WordProgressSummary[]) => {
          if (!Array.isArray(data)) return;
          const map: Record<string, WordProgressSummary> = {};
          data.forEach((p) => { map[p.wordId] = p; });
          setUpdatedProgressMap(map);
        })
        .catch(() => {});
    }
    practice.advance();
  }

  return (
    <PageContainer
      title={t("practiceTitle")}
      subtitle={
        session.phase === "setup" || session.phase === "loading"
          ? isEnToJp ? t("practiceSubtitleEnToJp") : t("practiceSubtitle")
          : ""
      }
    >
      {session.phase === "setup" && (
        <SetupPhase
          direction={setup.direction}
          onDirectionChange={setup.setDirection}
          allVocab={setup.allVocab}
          selectedVocabIds={setup.selectedVocabIds}
          vocabLoading={setup.vocabLoading}
          onToggleVocab={setup.toggleVocab}
          onToggleAllVocab={setup.toggleAllVocab}
          decks={setup.decks}
          decksLoading={setup.decksLoading}
          selectedDeckId={setup.selectedDeckId}
          onDeckChange={setup.setSelectedDeckId}
          allGrammar={setup.allGrammar}
          selectedGrammarIds={setup.selectedGrammarIds}
          grammarLoading={setup.grammarLoading}
          onToggleGrammar={setup.toggleGrammar}
          grammarByJlpt={setup.grammarByJlpt}
          jlptGroups={setup.jlptGroups}
          grammarByGenki={setup.grammarByGenki}
          genkiGroups={setup.genkiGroups}
          progressMap={setup.progressMap}
          onFocusWeak={setup.focusWeak}
          weakCount={setup.weakCount}
          onFocusDue={setup.focusDue}
          dueCount={setup.dueCount}
          error={session.error}
          onStart={() => handleStartSession()}
          t={t}
        />
      )}

      {session.phase === "loading" && (
        <LoadingPhase
          loadingStep={session.loadingStep}
          audioLoadedCount={session.audioLoadedCount}
          sessionLength={session.session.length}
          t={t}
        />
      )}

      {session.phase === "practicing" && practice.currentQuestion && (
        <PracticingPhase
          currentQuestion={practice.currentQuestion}
          isRetry={practice.isRetry}
          queuePos={practice.queuePos}
          queueLength={practice.queueLength}
          audioUrls={session.audioUrls}
          currentJudge={practice.currentJudge}
          judging={practice.judging}
          answer={practice.answer}
          setAnswer={practice.setAnswer}
          inputMode={practice.inputMode}
          setInputMode={practice.setInputMode}
          isRecording={practice.isRecording}
          showHint={practice.showHint}
          setShowHint={practice.setShowHint}
          showSentence={practice.showSentence}
          setShowSentence={practice.setShowSentence}
          activeHintWord={practice.activeHintWord}
          setActiveHintWord={practice.setActiveHintWord}
          onShowSessionInfo={() => practice.setShowSessionInfo(true)}
          isEnToJp={isEnToJp}
          isLastQuestion={practice.isLastQuestion}
          onNext={handleNext}
          handleJudge={practice.handleJudge}
          handleTextSubmit={practice.handleTextSubmit}
          handleRecordStart={practice.handleRecordStart}
          handleRecordEnd={practice.handleRecordEnd}
          t={t}
        />
      )}

      {session.phase === "finished" && (
        <FinishedPhase
          session={session.session}
          results={practice.getSessionResults()}
          retryCounts={practice.retryCounts}
          progressMap={setup.progressMap}
          updatedProgressMap={updatedProgressMap}
          todayCount={todayCount}
          onPracticeAgain={() => handleStartSession()}
          onPracticeMistakes={handlePracticeMistakes}
          onBackToSetup={handleBackToSetup}
          t={t}
        />
      )}

      {practice.showSessionInfo && (
        <SessionInfoModal
          allVocab={setup.allVocab}
          selectedVocabIds={setup.selectedVocabIds}
          allGrammar={setup.allGrammar}
          selectedGrammarIds={setup.selectedGrammarIds}
          direction={setup.direction}
          onClose={() => practice.setShowSessionInfo(false)}
          t={t}
        />
      )}
    </PageContainer>
  );
}
