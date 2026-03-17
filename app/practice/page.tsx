"use client";

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

export default function PracticePage() {
  const { t: tTyped } = useLanguage();
  const t = tTyped as (key: string) => string;
  const setup = useSetupData();
  const session = useSession();
  const practice = usePractice(session.session, setup.direction);

  const isEnToJp = setup.direction === "en-to-jp";

  async function handleStartSession() {
    const questions = await session.startSession({
      direction: setup.direction,
      selectedVocabIds: setup.selectedVocabIds,
      selectedGrammarIds: setup.selectedGrammarIds,
      allVocabLength: setup.allVocab.length,
    });
    if (questions) practice.reset(questions.length);
  }

  function handleBackToSetup() {
    practice.reset();
    session.resetSession();
  }

  function handleNext() {
    if (practice.currentIdx + 1 >= session.session.length) {
      session.setPhase("finished");
      // Submit all question results to record progress at session level
      const progressResults = session.session.map((q, i) => ({
        wordId: q.wordUsed.id,
        correct: practice.results[i]?.correct ?? false,
      }));
      fetch("/api/progress/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results: progressResults }),
      }).catch(() => {});
    } else {
      practice.advance();
    }
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
          grammarTab={setup.grammarTab}
          onGrammarTabChange={setup.setGrammarTab}
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
          error={session.error}
          onStart={handleStartSession}
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

      {session.phase === "practicing" && (
        <PracticingPhase
          session={session.session}
          currentIdx={practice.currentIdx}
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
          onShowSessionInfo={() => practice.setShowSessionInfo(true)}
          isEnToJp={isEnToJp}
          onNext={handleNext}
          onBackToSetup={handleBackToSetup}
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
          results={practice.results}
          onPracticeAgain={handleStartSession}
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
