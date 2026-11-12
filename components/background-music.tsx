"use client";

import { useEffect, useRef, useState } from "react";

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.35;

    return () => { audio.pause(); };
  }, []);

  async function toggleMusic() {
    const audio = audioRef.current;
    if (!audio || starting) return;
    setError("");
    if (!audio.paused) {
      audio.pause();
      return;
    }
    setStarting(true);
    audio.volume = 0.35;
    try {
      await audio.play();
    } catch {
      setError("เล่นเพลงไม่ได้ กรุณาลองเปิดเสียงอีกครั้ง");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="background-music" data-music-control>
      <audio ref={audioRef} src="/audio/thai.mp3" loop preload="metadata"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onError={() => { setPlaying(false); setError("โหลดเพลงไม่ได้ กรุณาลองใหม่อีกครั้ง"); }} />
      <button type="button" className="music-toggle" onClick={toggleMusic}
        aria-label={playing ? "ปิดเสียงเพลงลอยกระทง" : "เปิดเสียงเพลงลอยกระทง"} aria-pressed={playing}
        disabled={starting} title={playing ? "ปิดเสียงเพลงลอยกระทง" : "เปิดเสียงเพลงลอยกระทง"}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 5 6 9H3v6h3l5 4Z" />
          {playing ? <><path d="M15 8a6 6 0 0 1 0 8" /><path d="M18 5a10 10 0 0 1 0 14" /></> : <path d="m16 9 6 6m0-6-6 6" />}
        </svg>
        <span>{starting ? "กำลังเปิด…" : playing ? "ปิดเสียงเพลง" : "เปิดเสียงเพลง"}</span>
      </button>
      <span className="music-error" role="status">{error}</span>
    </div>
  );
}
