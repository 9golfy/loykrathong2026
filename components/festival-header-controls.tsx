"use client";

import { useState, useSyncExternalStore } from "react";
import BackgroundMusic from "./background-music";

function subscribeFullscreen(update: () => void) {
  document.addEventListener("fullscreenchange", update);
  return () => document.removeEventListener("fullscreenchange", update);
}
function fullscreenSnapshot() {
  return !document.fullscreenEnabled ? "unsupported" : document.fullscreenElement ? "fullscreen" : "windowed";
}

export default function FestivalHeaderControls() {
  const mode = useSyncExternalStore(subscribeFullscreen, fullscreenSnapshot, () => "unsupported");
  const fullscreen = mode === "fullscreen";
  const supported = mode !== "unsupported";
  const [error, setError] = useState("");

  async function toggleFullscreen() {
    setError("");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setError("เปิดเต็มจอไม่ได้ กรุณาลองอีกครั้ง");
    }
  }

  const label = fullscreen ? "ออกจากเต็มจอ" : "ขนาดเต็มจอ";
  return <div className="festival-header-controls">
    <button type="button" className="fullscreen-toggle" onClick={toggleFullscreen} aria-label={label} aria-pressed={fullscreen} disabled={!supported} title={supported ? label : "เบราว์เซอร์นี้ไม่รองรับการแสดงเต็มจอ"}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={fullscreen ? "M8 3v5H3m18 0h-5V3M3 16h5v5m8 0v-5h5" : "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"} />
      </svg><span>{label}</span>
    </button>
    <BackgroundMusic />
    <span className="header-control-error" role="status">{error}</span>
  </div>;
}
