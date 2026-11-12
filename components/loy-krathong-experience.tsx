"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import "./festival.css";
import FestivalEvents, { Lotus } from "@/components/festival-events";
import WishFramedCard from "@/components/wish-framed-card";
import FestivalHeroScene from "@/components/festival-hero-scene";
import FestivalHeaderControls from "@/components/festival-header-controls";
import KrathongRiver, { type RiverKrathong, type RiverDetailControls } from "@/components/krathong-river";

import Image from "next/image";
import { thaiNumerals } from "@/lib/thai-numerals";
import { countWishWords, limitWishInput, MAX_WISH_WORDS, MAX_WISH_LENGTH, MAX_NICKNAME_LENGTH } from "@/lib/wish-limits";
import { WISHES_PER_PAGE } from "@/lib/wish-pagination";
import { krathongDesigns as designs, krathongImage } from "@/lib/krathong-designs";
import { SHOW_FESTIVAL_EVENTS } from "@/lib/festival-events";

type Wish = { id: string; nickname: string; wish: string; shareToken?: string; design: { key: string; emoji: string; name: string }; createdAt: string };
type WishPage = { page: number; pageCount: number; submissions: Wish[] };

export default function LoyKrathongExperience({ sharedWish }: { sharedWish?: RiverKrathong }) {
  const [selected, setSelected] = useState(designs[0]);
  const [nickname, setNickname] = useState("");
  const [wish, setWish] = useState("");
  const [wishLimitNotice, setWishLimitNotice] = useState("");
  const wishWordCount = countWishWords(wish);
  const wishOverLimit = wishWordCount > MAX_WISH_WORDS || wish.length > MAX_WISH_LENGTH;
  const [isPublic, setIsPublic] = useState(true);
  const [wishPage, setWishPage] = useState<WishPage>({ page: 1, pageCount: 1, submissions: [] });
  const [wishRequest, setWishRequest] = useState({ page: 1 });
  const [wishPageError, setWishPageError] = useState(false);
  const [wishFeedLoaded, setWishFeedLoaded] = useState(false);
  const [riverKrathongs, setRiverKrathongs] = useState<RiverKrathong[]>([]);
  const [myKrathongIds, setMyKrathongIds] = useState<string[]>(() => {
    try {
      const saved: unknown = JSON.parse(typeof window === "undefined" ? "[]" : localStorage.getItem("loy-krathong-2026-own-ids") || "[]");
      return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string").slice(0, 24) : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState(false);
  const [scenePaused, setScenePaused] = useState(false);

  const creatorRef = useRef<HTMLDialogElement>(null);
  const riverDetailsRef = useRef<RiverDetailControls>(null);
  const publicationVersion = useRef(0);
  const [creatorOpen, setCreatorOpen] = useState(false);

  function cycleDesign(direction: number) {
    const index = designs.findIndex((design) => design.key === selected.key);
    setSelected(designs[(index + direction + designs.length) % designs.length]);
  }

  function openCreator() {
    if (completed) { setNickname(""); setWish(""); }
    setCompleted(false);
    setMessage("");
    setWishLimitNotice("");
    creatorRef.current?.showModal();
    setCreatorOpen(true);
  }

  function closeCreator() {
    if (loading) return;
    creatorRef.current?.close();
    setCreatorOpen(false);
  }

  useEffect(() => {
    if (!creatorOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [creatorOpen]);

  useEffect(() => {
    const controller = new AbortController();
    let refreshing = false;
    async function refreshRiver() {
      if (refreshing) return;
      refreshing = true;
      const version = publicationVersion.current;
      try {
        const response = await fetch(`/api/submissions?page=${wishRequest.page}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Wish feed unavailable");
        const data = await response.json();
        if (controller.signal.aborted || version !== publicationVersion.current) return;
        if (data.databaseReady === false) throw new Error("Wish feed unavailable");
        setWishPage({ page: data.page, pageCount: data.pageCount, submissions: data.submissions });
        setWishFeedLoaded(true);
        setWishPageError(false);
        if (data.page !== wishRequest.page) setWishRequest({ page: data.page });
        setRiverKrathongs(data.riverKrathongs ?? []);
      } catch {
        if (!controller.signal.aborted && version === publicationVersion.current) setWishPageError(true);
      } finally {
        refreshing = false;
      }
    }
    void refreshRiver();
    const timer = window.setInterval(refreshRiver, 15000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [wishRequest]);

  const boats = riverKrathongs.map((item) => ({ ...item, own: myKrathongIds.includes(item.id) }));
  const wishes = wishPage.submissions;
  const changingWishPage = !wishPageError && wishRequest.page !== wishPage.page;
  const firstVisiblePage = Math.max(1, Math.min(wishPage.page - 2, wishPage.pageCount - 4));
  const visiblePages = Array.from({ length: Math.min(5, wishPage.pageCount) }, (_, index) => firstVisiblePage + index);

  function goToWishPage(page: number) {
    setWishPageError(false);
    setWishRequest({ page });
    const heading = document.getElementById("wishes-title");
    heading?.focus({ preventScroll: true });
    document.getElementById("wishes")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (wishOverLimit || wishWordCount === 0) {
      setMessage("กรุณาเขียนคำอธิษฐาน ๑–๒๒ คำ (ไม่นับ ๆ เป็นคำ)");
      return;
    }
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designKey: selected.key, nickname, wish, isPublic }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "ส่งคำอธิษฐานไม่สำเร็จ");
      const publishedWish: Wish | null = data.publishedWish;
      if (publishedWish) {
        publicationVersion.current += 1;
        setWishPage(current => current.page === 1 ? {
          ...current,
          submissions: [publishedWish, ...current.submissions.filter(item => item.id !== publishedWish.id)].slice(0, WISHES_PER_PAGE),
        } : current);
        setWishRequest({ page: 1 });
        setRiverKrathongs(items => [publishedWish, ...items.filter(item => item.id !== publishedWish.id)].slice(0, 24));
      }
      setCompleted(true);
      creatorRef.current?.close();
      setCreatorOpen(false);
      const ownIds = [data.submission.id, ...myKrathongIds].slice(0, 24);
      setMyKrathongIds(ownIds);
      try { localStorage.setItem("loy-krathong-2026-own-ids", JSON.stringify(ownIds)); } catch { /* Keep this session usable when storage is unavailable. */ }
      document.getElementById("top")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="festival-page">
      <header className="festival-navbar">
        <div className="festival-container navbar-inner">
          <a className="festival-brand" href="#top"><span className="department-emblem"><Image src="/images/culture-department-logo.png" alt="" width={208} height={52} /></span><span className="department-wordmark"><span className="department-wordmark-thai">กรมส่งเสริมวัฒนธรรม</span><span className="department-wordmark-english" lang="en">DEPARTMENT OF CULTURAL PROMOTION</span></span></a>
          <FestivalHeaderControls />
        </div>
      </header>
      <section className="reference-hero layered-hero" id="top" aria-labelledby="hero-title">
        <FestivalHeroScene paused={scenePaused || creatorOpen} />
        <div className="festival-container hero-layout"><div className="reference-hero-copy">
          <p className="hero-overline">กรมส่งเสริมวัฒนธรรมขอเชิญชวน</p>
          <h1 id="hero-title"><span className="hero-title-main">ลอยกระทงออนไลน์</span><span className="hero-title-year">พุทธศักราช ๒๕๖๙</span></h1>
          <div className="hero-gold-ornament"><span/><Lotus /><span/></div>
          <p className="hero-tagline"><span>ลอยกระทง ไท ไทย</span>{" "}<span>สืบสานคุณค่า สู่คนรุ่นใหม่</span></p>
          <div className="festival-entry-layout" id="meaning" role="group" aria-label="ปักหมุดลอยกระทงและลอยกระทงออนไลน์">
            <a
              className="festival-map-banner"
              href="https://www.culture.go.th/culture_th/ewt_news.php?nid=9652&filename=index"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/images/festival-pin-banner-2569.png"
                alt="ปักหมุดลอยกระทง ๒๕๖๙ — ดูข้อมูลสถานที่จัดงานทั่วไทย (เปิดในแท็บใหม่)"
                width={2022}
                height={778}
                sizes="(max-width: 500px) 45vw, 224px"
              />
            </a>
            <button className="festival-online-entry" onClick={openCreator} type="button" aria-haspopup="dialog">
              <Image className="festival-online-icon" src={krathongImage(designs[0].key)} alt="" width={112} height={112} sizes="54px" />
              <span className="festival-online-label">ลอยกระทง<span aria-hidden="true">›</span></span>
            </button>
          </div>
        </div></div>
        {completed && !isPublic && <p className="hero-submission-status" role="status">บันทึกคำอธิษฐานส่วนตัวแล้ว</p>}
        <KrathongRiver krathongs={boats} onCreate={openCreator} sharedWish={sharedWish} onPauseChange={setScenePaused} controlsRef={riverDetailsRef} paused={creatorOpen} />
      </section>

      <dialog className="creator-dialog framed-creator" ref={creatorRef} aria-labelledby="creator-title" aria-describedby="creator-description" onClose={() => setCreatorOpen(false)} onCancel={(event) => { if (loading) event.preventDefault(); }} onClick={(event) => { if (event.target === event.currentTarget) closeCreator(); }}>
        <div className="creator-content">
          <button type="button" className="creator-close" onClick={closeCreator} disabled={loading} aria-label="ปิดหน้าต่างสร้างกระทง">×</button>
          <form onSubmit={handleSubmit}>
            <div className="creator-card-preview" aria-label="ตัวอย่างการ์ดคำอธิษฐาน">
              <WishFramedCard designKey={selected.key} designName={selected.name} wish={wish} nickname={nickname} />
            </div>
            <div className="creator-editor">
              <div className="hero-gold-ornament"><span/><Lotus/><span/></div>
              <h2 id="creator-title">สร้างการ์ดคำอธิษฐาน</h2>
              <p id="creator-description">เลือกกระทงและเขียนคำอธิษฐาน ดูตัวอย่างการ์ดได้ทันที</p>
            <fieldset className="creator-designs"><legend>เลือกกระทง</legend>
              <div className="creator-cycle"><button type="button" onClick={() => cycleDesign(-1)} aria-label="กระทงแบบก่อนหน้า">←</button><span>{selected.name}</span><button type="button" onClick={() => cycleDesign(1)} aria-label="กระทงแบบถัดไป">→</button></div>
              <div className="creator-design-grid">{designs.map((design) => <button type="button" key={design.key} className={selected.key === design.key ? "is-selected" : ""} aria-label={design.name} aria-pressed={selected.key === design.key} onClick={() => setSelected(design)}><Image src={design.image} alt="" width={68} height={68} /><span className="design-selected-mark" aria-hidden="true">✓</span></button>)}</div>
            </fieldset>
            <div className="creator-fields">
            <div className="creator-label-row"><label className="creator-label" htmlFor="nickname">ชื่อของคุณ <span>(Name)</span></label><small>{thaiNumerals(nickname.length)}/๓๐ ตัวอักษร</small></div>
            <input id="nickname" autoComplete="nickname" maxLength={MAX_NICKNAME_LENGTH} placeholder="ชื่อเล่น หรือนามแฝง" value={nickname} onChange={(event) => setNickname(event.target.value)} aria-describedby="nickname-limit-hint" required />
            <p className="creator-hint" id="nickname-limit-hint">ชื่อบรรทัดเดียว ไม่เกิน ๓๐ ตัวอักษรรวมช่องว่าง</p>
            <div className="creator-label-row"><label className="creator-label" htmlFor="wish">คำอธิษฐาน <span>(Wish)</span></label><small id="wish-word-count" aria-live="polite" className={wishOverLimit ? "wish-count-exceeded" : ""}>{thaiNumerals(wishWordCount)}/๒๒ คำ · {thaiNumerals(wish.length)}/๑๐๐ อักขระ</small></div>
            <textarea id="wish" maxLength={MAX_WISH_LENGTH} rows={3} placeholder="ใส่คำอธิษฐานของคุณ ไม่เกิน ๒๒ คำ" value={wish} onChange={(event) => { const next = limitWishInput(event.target.value); setWish(next); setWishLimitNotice(next !== event.target.value.replace(/\s+/gu, " ") ? "รับข้อความได้ไม่เกิน ๒๒ คำ และ ๑๐๐ อักขระรวมช่องว่าง" : ""); }} aria-invalid={wishOverLimit} aria-describedby="wish-word-count wish-limit-hint" required />
            <p className="creator-hint" id="wish-limit-hint">ไม่เกิน ๒๒ คำ และ ๑๐๐ อักขระรวมช่องว่าง • ไม่นับ “ๆ” เป็นคำ</p>
            {wishLimitNotice && <p className="creator-hint" role="status">{wishLimitNotice}</p>}
            {wishOverLimit && <p className="form-error" role="alert">เกิน {thaiNumerals(wishWordCount - MAX_WISH_WORDS)} คำ กรุณาลดข้อความก่อนสร้างกระทง</p>}
            </div>

            <label className="creator-privacy"><input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} /><span>แสดงกระทงต่อสาธารณะ<small>เมื่อเลือกตัวเลือกนี้ ชื่อผู้ส่งและคำอธิษฐานจะเผยแพร่ทันที</small></span></label>
            {message && <p className="form-error" role="alert">{message}</p>}
            <button className="creator-submit" type="submit" disabled={loading || wishOverLimit}>{loading ? "กำลังส่งคำอธิษฐาน…" : "สร้างกระทง"}</button>
            </div>
          </form>
        </div>
      </dialog>

      <section className="reference-wishes" id="wishes" aria-labelledby="wishes-title"><div className="festival-container">
        <div className="section-ornament"><span/><Lotus /><h2 id="wishes-title" tabIndex={-1}>คำอธิษฐานจากสายน้ำ</h2><Lotus /><span/></div>
        <p className="section-description">ฝากความปรารถนาดีลงในกระทง ส่งต่อพลังใจไปกับสายน้ำแห่งความหวัง</p>
        {wishPageError && <p className="wish-pagination-error" role="status">โหลดคำอธิษฐานไม่สำเร็จ <button type="button" onClick={() => goToWishPage(wishRequest.page)}>ลองอีกครั้ง</button></p>}
        {!wishPageError && wishes.length === 0 && <p className="wish-feed-status" role="status">{wishFeedLoaded ? "ยังไม่มีคำอธิษฐานที่เผยแพร่" : "กำลังโหลดคำอธิษฐาน…"}</p>}
        {wishes.length > 0 && <div className="reference-wish-grid" aria-busy={changingWishPage}>{wishes.map(item => <article className="reference-wish-card" key={item.id}>
          <Image src={krathongImage(item.design.key)} alt="กระทงแห่งคำอธิษฐาน" width={160} height={130} sizes="160px"/>
          <blockquote>“{item.wish}”</blockquote>{item.nickname && <p>— {item.nickname}</p>}
          <button type="button" className="wish-card-open" aria-label={`อ่านคำอธิษฐาน${item.nickname ? `ของ ${item.nickname}` : ""}`} onClick={() => riverDetailsRef.current?.openWish({ ...item, isPublic: true })} />
        </article>)}</div>}
        {wishPage.pageCount > 1 && <nav className="wish-pagination" aria-label="หน้าคำอธิษฐาน">
          <button type="button" aria-label="หน้าก่อนหน้า" disabled={changingWishPage || wishPage.page === 1} onClick={() => goToWishPage(wishPage.page - 1)}>‹</button>
          {visiblePages.map(page => <button
            key={page}
            type="button"
            aria-label={`หน้า ${page}`}
            aria-current={page === wishPage.page ? "page" : undefined}
            disabled={changingWishPage}
            onClick={() => { if (page !== wishPage.page) goToWishPage(page); }}
          >{page}</button>)}
          <button type="button" aria-label="หน้าถัดไป" disabled={changingWishPage || wishPage.page === wishPage.pageCount} onClick={() => goToWishPage(wishPage.page + 1)}>›</button>
        </nav>}
        <button className="gold-button wish-create-button" type="button" onClick={openCreator}>เขียนคำอธิษฐาน</button>
      </div></section>
      {SHOW_FESTIVAL_EVENTS && <FestivalEvents />}
      <footer className="reference-footer"><div className="festival-container footer-inner"><a className="festival-brand" href="#top"><span className="department-emblem"><Image src="/images/culture-department-logo.png" alt="" width={208} height={52}/></span><span className="department-wordmark"><span className="department-wordmark-thai">กรมส่งเสริมวัฒนธรรม</span><span className="department-wordmark-english" lang="en">DEPARTMENT OF CULTURAL PROMOTION</span></span></a><strong className="festival-footer-title">ลอยกระทงออนไลน์พุทธศักราช ๒๕๖๙</strong></div></footer>
    </main>
  );
}

