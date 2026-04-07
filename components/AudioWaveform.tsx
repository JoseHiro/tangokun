"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

interface AudioWaveformProps {
  audioUrl: string;
  autoPlay?: boolean;
}

export default function AudioWaveform({ audioUrl, autoPlay = false }: AudioWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy previous instance
    wsRef.current?.destroy();
    setIsReady(false);
    setIsPlaying(false);

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#e9d5ff",       // purple-200 — soft lavender
      progressColor: "#a78bfa",   // violet-400 — gentle purple
      cursorColor: "transparent",
      height: 36,
      barWidth: 3,
      barGap: 2,
      barRadius: 8,
      normalize: true,
      interact: true,
    });

    ws.load(audioUrl).catch(() => {}); // absorb AbortError from load() when destroyed while loading

    ws.on("error", () => {});

    ws.on("ready", () => {
      setIsReady(true);
      if (autoPlay) ws.play();
    });
    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("finish", () => setIsPlaying(false));

    wsRef.current = ws;

    return () => {
      wsRef.current = null;
      try {
        ws.destroy();
      } catch {
        // WaveSurfer can throw or trigger "signal aborted" when destroyed
        // while loading; ignore so cleanup doesn’t surface as an error.
      }
    };
  }, [audioUrl, autoPlay]);

  function togglePlay() {
    wsRef.current?.playPause();
  }

  return (
    <div className="flex items-center gap-3 w-full">
      {/* Play / Pause */}
      <button
        onClick={togglePlay}
        disabled={!isReady}
        className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-all ${
          isReady
            ? "bg-violet-100 dark:bg-violet-900/30 text-violet-500 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/40 active:scale-95"
            : "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed"
        }`}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          // Pause icon
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          // Play icon
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Waveform */}
      <div className="flex-1 relative">
        <div
          ref={containerRef}
          className={`w-full transition-opacity duration-300 ${isReady ? "opacity-100" : "opacity-40"}`}
        />
        {!isReady && (
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
          </div>
        )}
      </div>
    </div>
  );
}
