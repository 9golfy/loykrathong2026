"use client";

import { useState, useSyncExternalStore } from "react";
import { defaultPierCouple, getPierCouple } from "@/lib/pier-couples";

const storageKey = "loy-krathong-2026-pier-couple";
const changeEvent = "loy-krathong-pier-couple-change";

function subscribe(notify: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === storageKey || event.key === null) notify();
  }

  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, notify);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, notify);
  };
}

function getSavedKey() {
  try { return getPierCouple(localStorage.getItem(storageKey))?.key ?? defaultPierCouple.key; }
  catch { return defaultPierCouple.key; }
}

const getDefaultKey = () => defaultPierCouple.key;

export function usePierCouplePreference() {
  const savedKey = useSyncExternalStore(subscribe, getSavedKey, getDefaultKey);
  const [sessionKey, setSessionKey] = useState<string | null>(null);

  function selectCouple(key: string) {
    if (!getPierCouple(key)) return;
    try {
      localStorage.setItem(storageKey, key);
      setSessionKey(null);
      window.dispatchEvent(new Event(changeEvent));
    } catch {
      setSessionKey(key);
    }
  }

  return { coupleKey: sessionKey ?? savedKey, selectCouple };
}
