"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { getKrathongDesign } from "@/lib/krathong-designs";
import { getWishCardLayout, wishCardSize, type WishCardRect } from "@/lib/wish-card-layout";
import { getPierCouple } from "@/lib/pier-couples";

function positionLayer(rect: WishCardRect) {
  return {
    left: (rect.left / wishCardSize.width) * 100 + "%",
    top: (rect.top / wishCardSize.height) * 100 + "%",
    width: (rect.width / wishCardSize.width) * 100 + "%",
    height: (rect.height / wishCardSize.height) * 100 + "%",
  };
}

export default function WishFramedCard({ designKey, designName, wish, nickname, coupleKey, pending = false }: {
  designKey: string; designName: string; wish: string; nickname: string; coupleKey?: string | null; pending?: boolean;
}) {
  const couple = getPierCouple(coupleKey);
  const design = getKrathongDesign(designKey);
  const artOnly = !wish.trim() && !nickname.trim() && !pending;
  const layout = couple ? getWishCardLayout(couple, design.key, artOnly) : undefined;
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
  return <div className={`wish-framed-card${couple ? " has-pier-couple" : ""}${artOnly ? " is-art-only" : ""}`}>
    <Image className="wish-frame-background" src="/images/wish-card-frame-department.png" alt="" width={1122} height={1402} sizes="(max-width: 760px) 90vw, 480px" />
    {couple && <Image className="wish-framed-couple"
      src={layout ? "/images/wish-card-outfits/" + couple.key + ".png" : couple.src}
      style={layout ? positionLayer(layout.characterRect) : undefined}
      alt={couple.label} width={couple.width} height={couple.height} sizes="(max-width:760px) 48vw, 260px" />}
    <Image className="wish-framed-boat" src={design.image} alt={designName}
      data-color-lotus={design.key.startsWith("lotus-color-")}
      style={layout ? {
        ...positionLayer(layout.boatRect),
        transformOrigin: (layout.boatAnchor.x * 100) + "% " + (layout.boatAnchor.y * 100) + "%",
      } : undefined}
      width={layout?.boatSize.width ?? 560} height={layout?.boatSize.height ?? 360}
      sizes={layout ? "(max-width:760px) 35vw, 180px" : undefined} />
    {!couple && <Image className="wish-framed-reflection" src={design.image} alt="" aria-hidden="true" width={560} height={360} />}
    {pending ? <p className="wish-framed-pending">คำอธิษฐานใบนี้กำลังรอการตรวจสอบ</p> : <>
      {wish.trim() && <blockquote ref={quoteRef} className={wish.length > 140 ? "is-long is-extra-long" : wish.length > 70 ? "is-long" : ""}>{`“${wish}”`}</blockquote>}
      {nickname.trim() && <p className={`wish-framed-author${nickname.trim().length > 24 ? " is-long-name" : ""}`}><span>{nickname.trim()}</span></p>}
    </>}
  </div>;
}
