"use client";

import { type CSSProperties, type Ref, useCallback, useEffect, useImperativeHandle, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { krathongImage } from "@/lib/krathong-designs";
import { advanceRiverQueue, reconcileRiverQueue, type RiverBoatMotion } from "@/lib/river-motion";
import WishFramedCard from "@/components/wish-framed-card";
import { defaultPierCouple } from "@/lib/pier-couples";
import { downloadCompositeWishCard } from "@/lib/wish-card-image";
import WishQrCode from "@/components/wish-qr-code";

const subscribeToOrigin = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => "";

export type RiverKrathong = {
  id: string;
  design: { key: string; name: string };
  nickname?: string;
  wish?: string;
  own?: boolean;
  isPublic?: boolean;
  shareToken?: string;
  coupleKey?: string | null;
};

export type RiverDetailControls = { openWish: (wish: RiverKrathong) => void };

export default function KrathongRiver({ krathongs, sharedWish, onPauseChange, controlsRef }: { krathongs: RiverKrathong[]; sharedWish?: RiverKrathong; onPauseChange?: (paused: boolean) => void; controlsRef?: Ref<RiverDetailControls> }) {
  const [active, setActive] = useState<RiverKrathong | null>(sharedWish ?? null);
  const [shareMessage, setShareMessage] = useState("");
  const [downloading, setDownloading] = useState(false);
  const origin = useSyncExternalStore(subscribeToOrigin, getOrigin, getServerOrigin);
  const detailRef = useRef<HTMLDialogElement>(null);
  const riverRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<RiverBoatMotion[]>([]);
  const sizeOffsets = useRef(new Map<string, number>());
  const boatIds = JSON.stringify(krathongs.map(item => item.id));
  const openWish = useCallback((item: RiverKrathong) => { setShareMessage(""); setActive(item); }, []);
  useImperativeHandle(controlsRef, () => ({ openWish }), [openWish]);

  useEffect(() => {
    const river = riverRef.current;
    if (!river) return;
    const elements = Array.from(river.querySelectorAll<HTMLElement>(".river-voyage"));
    if (!elements.length) { queueRef.current = []; return; }
    const byId = new Map(elements.map(element => [element.dataset.boatId!, element]));
    for (const element of elements) {
      const id = element.dataset.boatId!;
      if (!sizeOffsets.current.has(id)) sizeOffsets.current.set(id, Math.random() * 20 - 10);
      element.style.setProperty("--boat-size-offset", `${sizeOffsets.current.get(id)}px`);
      element.style.setProperty("--bob-duration", `${2.3 + Math.random() * 2.7}s`);
      element.style.setProperty("--bob-delay", `${-Math.random() * 6}s`);
      element.style.setProperty("--bob-height", `${3 + Math.random() * 5}px`);
    }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let boatWidth = 0;
    let gap = 0;
    let entryOffset = 0;
    let queue: RiverBoatMotion[] = [];
    let frame = 0;
    let previous = 0;
    function paint() {
      for (const [index, boat] of queue.entries()) {
        const element = byId.get(boat.id)!;
        const x = reducedMotion.matches ? index * (boatWidth + gap + 16) : boat.x;
        element.style.transform = `translateX(${x + entryOffset}px)`;
        element.style.visibility = x + boatWidth < 0 || x > width ? "hidden" : "visible";
      }
    }
    function resize() {
      entryOffset = Math.max(0, (river!.clientWidth - 1100) / 2);
      width = river!.clientWidth - entryOffset;
      boatWidth = Math.max(...elements.map(element => element.getBoundingClientRect().width));
      gap = boatWidth < 180 ? 5 : 6;
      queue = reconcileRiverQueue(queueRef.current, elements.map(element => element.dataset.boatId!), boatWidth, gap);
      queueRef.current = queue;
      paint();
    }
    function tick(now: number) {
      const seconds = previous ? Math.min((now - previous) / 1000, .05) : 0;
      previous = now;
      if (!document.hidden && !reducedMotion.matches) {
        advanceRiverQueue(queue, seconds, width, boatWidth + gap);
        paint();
      }
      frame = requestAnimationFrame(tick);
    }
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(river);
    reducedMotion.addEventListener("change", paint);
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); reducedMotion.removeEventListener("change", paint); };
  }, [boatIds]);

  useEffect(() => {
    onPauseChange?.(active !== null);
  }, [active, onPauseChange]);

  useEffect(() => {
    if (!active) return;
    const dialog = detailRef.current;
    dialog?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = previous; };
  }, [active]);

  function shareUrl() { return origin && active?.shareToken ? new URL('/wish/' + encodeURIComponent(active.shareToken), origin).href : ""; }

  async function copyLink() {
    try { await navigator.clipboard.writeText(shareUrl()); setShareMessage("คัดลอกลิงก์แล้ว"); }
    catch { setShareMessage("คัดลอก URL จากลิงก์การ์ดได้เลย"); }
  }

  async function downloadCard() {
    if (!active?.wish) return;
    setDownloading(true);
    try {
      const card = detailRef.current?.querySelector<HTMLElement>(".wish-framed-card");
      if (!card) throw new Error("Wish preview unavailable");
      await downloadCompositeWishCard(card);
      setShareMessage('ดาวน์โหลดการ์ดแล้ว');
    } catch { setShareMessage('ดาวน์โหลดไม่สำเร็จ กรุณาลองอีกครั้ง'); }
    finally { setDownloading(false); }
  }

  function shareLine() {
    const url = encodeURIComponent(shareUrl());
    const target = 'https://social-plugins.line.me/lineit/share?url=' + url;
    window.open(target, '_blank', 'noopener,noreferrer,width=640,height=640');
  }

  return <><div ref={riverRef} className="krathong-river" role="region" aria-label="สายน้ำแห่งคำอธิษฐาน">
    <div className="river-moon-trail" aria-hidden="true" />
    {krathongs.map((item, index) => <div key={item.id} data-boat-id={item.id} className="river-voyage" style={{
      "--lane": `${90 + (index % 2) * 16}px`,
      "--boat-scale": "1",
    } as CSSProperties}>
      <button type="button" className={`river-boat${item.own ? " is-own" : ""}`} onClick={() => openWish(item)} aria-haspopup="dialog" aria-label={`${item.design.name}${item.own ? "ของคุณ" : ""}${item.nickname ? ` จาก ${item.nickname}` : ""}`}>
        <span className="river-read-hint">อ่านคำอธิษฐาน ＋</span>
        <Image className="river-boat-art" src={krathongImage(item.design.key)} alt="" width={260} height={230} />
        <span className="river-boat-label">{item.nickname || item.design.name}</span>
      </button>
    </div>)}
  </div>
  <dialog className="wish-dialog" ref={detailRef} aria-labelledby="wish-dialog-title" onClose={() => { if (!detailRef.current?.open) setActive(null); }} onClick={(event) => { if (event.target === event.currentTarget) setActive(null); }}>
    {active && <div className="wish-dialog-content">
      <button type="button" className="creator-close" onClick={() => setActive(null)} aria-label="ปิดคำอธิษฐาน">×</button>
      <WishFramedCard designKey={active.design.key} designName={active.design.name} wish={active.wish || ""} nickname={active.nickname || ""} coupleKey={active.coupleKey ?? defaultPierCouple.key} pending={!active.wish} />
      <div className="wish-card-actions">
      <p className="wish-dialog-kicker">A WISH ON THE WATER</p>
      <h2 id="wish-dialog-title">คำอธิษฐานบนสายน้ำ</h2>
      <p className="wish-dialog-design">{active.design.name}</p>
      {active.wish && <button type="button" className="gold-button wish-download-button" disabled={downloading} onClick={downloadCard}>{downloading ? "กำลังสร้างรูปภาพ…" : "↓ ดาวน์โหลดรูปภาพ"}</button>}
      {active.shareToken ? <div className="wish-sharing">
        <p>ส่งต่อคำอธิษฐานดี ๆ</p>
        <div className="wish-qr-sharing">{shareUrl() && <a className="wish-qr-link" href={shareUrl()} aria-label="เปิดการ์ดคำอธิษฐานนี้จาก QR Code"><WishQrCode url={shareUrl()} /><span>สแกนเพื่อเปิดการ์ดใบนี้</span></a>}<div className="wish-share-buttons"><button type="button" onClick={shareLine}>ส่งผ่าน LINE</button></div></div>
        <div className="wish-copy-link"><a aria-label="เปิดลิงก์การ์ดคำอธิษฐานนี้" href={shareUrl()}>{active.shareToken ? `/wish/${active.shareToken}` : ""}</a><button type="button" onClick={copyLink}>คัดลอกลิงก์</button></div>
        {shareMessage && <p className="wish-share-message" role="status">{shareMessage}</p>}
        <small>สแกน QR Code หรือแตะลิงก์เพื่อเปิดการ์ดใบนี้</small>
      </div> : active.wish && <p className="wish-dialog-pending">{active.isPublic === false ? "คำอธิษฐานนี้เป็นส่วนตัว จึงแชร์ต่อไม่ได้" : "การ์ดนี้ไม่มีลิงก์แชร์"}</p>}
      {shareMessage && !active.shareToken && <p role="status">{shareMessage}</p>}
      </div>
    </div>}
  </dialog></>;
}



