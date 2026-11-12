"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { krathongImage } from "@/lib/krathong-designs";

export default function WishFramedCard({ designKey, designName, wish, nickname, pending = false }: {
  designKey: string; designName: string; wish: string; nickname: string; pending?: boolean;
}) {
  const quoteRef = useRef<HTMLQuoteElement>(null);
  useEffect(() => {
    const quote = quoteRef.current;
    if (!quote) return;
    let cancelled = false;
    const fit = () => {
      if (cancelled) return;
      quote.style.removeProperty("font-size");
      let size = parseFloat(getComputedStyle(quote).fontSize);
      while ((quote.scrollHeight > quote.clientHeight + 1 || quote.scrollWidth > quote.clientWidth + 1) && size > 8) {
        size -= .5;
        quote.style.fontSize = `${size}px`;
      }
    };
    const observer = new ResizeObserver(fit);
    observer.observe(quote.parentElement!);
    fit();
    void document.fonts.ready.then(fit);
    return () => { cancelled = true; observer.disconnect(); };
  }, [wish, pending]);
  return <div className="wish-framed-card">
    <Image className="wish-frame-background" src="/images/wish-card-frame-department.png" alt="" width={1122} height={1402} sizes="(max-width: 760px) 90vw, 480px" />
    <Image className="wish-framed-boat" src={krathongImage(designKey)} alt={designName} width={560} height={360} />
    <Image className="wish-framed-reflection" src={krathongImage(designKey)} alt="" aria-hidden="true" width={560} height={360} />
    {pending ? <p className="wish-framed-pending">คำอธิษฐานใบนี้กำลังรอการตรวจสอบ</p> : <>
      {wish.trim() && <blockquote ref={quoteRef} className={wish.length > 140 ? "is-long is-extra-long" : wish.length > 70 ? "is-long" : ""}>{`“${wish}”`}</blockquote>}
      {nickname.trim() && <p className={`wish-framed-author${nickname.trim().length > 24 ? " is-long-name" : ""}`}><span>{nickname.trim()}</span></p>}
    </>}
  </div>;
}
