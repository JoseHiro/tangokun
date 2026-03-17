"use client";

import { useState, useRef, useCallback } from "react";
import type { InputMode, SessionQuestion, QuestionResult, Direction } from "../_types";

export function usePractice(session: SessionQuestion[], direction: Direction) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<(QuestionResult | null)[]>([]);
  const [currentJudge, setCurrentJudge] = useState<QuestionResult | null>(null);
  const [judging, setJudging] = useState(false);
  const [answer, setAnswer] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("voice");
  const [isRecording, setIsRecording] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSentence, setShowSentence] = useState(false);
  const [showSessionInfo, setShowSessionInfo] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  function reset(totalQuestions = 0) {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setCurrentIdx(0);
    setResults(new Array(totalQuestions).fill(null));
    setCurrentJudge(null);
    setAnswer("");
    setShowHint(false);
    setShowSentence(false);
    setInputMode("voice");
  }

  function advance() {
    setCurrentIdx((i) => i + 1);
    setCurrentJudge(null);
    setAnswer("");
    setShowHint(false);
    setShowSentence(false);
    setInputMode("voice");
    recognitionRef.current?.stop();
    setIsRecording(false);
  }

  const handleJudge = useCallback(
    async (ans: string) => {
      const q = session[currentIdx];
      if (!q || !ans.trim() || judging || currentJudge) return;

      setAnswer(ans);
      setJudging(true);

      const res = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence: q.sentence,
          userAnswer: ans.trim(),
          expectedTranslation: q.translation,
          direction,
        }),
      });
      const data = await res.json();

      const result: QuestionResult = {
        answer: ans.trim(),
        correct: data.correct,
        feedback: data.feedback,
        correctTranslation: data.correctTranslation,
      };

      setCurrentJudge(result);
      setResults((prev) => {
        const next = [...prev];
        next[currentIdx] = result;
        return next;
      });
      setJudging(false);
    },
    [session, currentIdx, judging, currentJudge, direction],
  );

  function handleRecordStart() {
    const SR =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = direction === "en-to-jp" ? "ja-JP" : "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => handleJudge(e.results[0][0].transcript as string);
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    rec.start();
    recognitionRef.current = rec;
    setIsRecording(true);
  }

  function handleRecordEnd() {
    recognitionRef.current?.stop();
  }

  function handleTextSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    handleJudge(answer);
  }

  return {
    currentIdx,
    results,
    currentJudge,
    judging,
    answer, setAnswer,
    inputMode, setInputMode,
    isRecording,
    showHint, setShowHint,
    showSentence, setShowSentence,
    showSessionInfo, setShowSessionInfo,
    reset,
    advance,
    handleJudge,
    handleRecordStart,
    handleRecordEnd,
    handleTextSubmit,
  };
}
