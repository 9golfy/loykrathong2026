"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { krathongImage } from "@/lib/krathong-designs";
import { pierCouples } from "@/lib/pier-couples";
import "./festival-hero-scene.css";

const fireworks = [
  { x: "12%", y: "18%", size: "180px", duration: "10s", delay: "-2.2s", pink: false },
  { x: "31%", y: "31%", size: "145px", duration: "11.8s", delay: "-6s", pink: true },
  { x: "48%", y: "13%", size: "160px", duration: "9.8s", delay: "-8.4s", pink: false },
  { x: "65%", y: "45%", size: "120px", duration: "12.5s", delay: "-4s", pink: true },
  { x: "81%", y: "19%", size: "145px", duration: "13.2s", delay: "-9s", pink: true },
  { x: "94%", y: "43%", size: "165px", duration: "11.3s", delay: "-3.1s", pink: false },
];

const lanterns = [
  { x: "7%", size: "42px", duration: "29s", delay: "-8s", drift: "28px" },
  { x: "20%", size: "34px", duration: "35s", delay: "-22s", drift: "-20px" },
  { x: "32%", size: "62px", duration: "31s", delay: "-19s", drift: "25px" },
  { x: "46%", size: "44px", duration: "38s", delay: "-12s", drift: "-24px" },
  { x: "59%", size: "30px", duration: "33s", delay: "-27s", drift: "15px" },
  { x: "72%", size: "39px", duration: "36s", delay: "-7s", drift: "-18px" },
  { x: "84%", size: "48px", duration: "32s", delay: "-18s", drift: "22px" },
  { x: "95%", size: "32px", duration: "40s", delay: "-29s", drift: "-28px" },
];

const sceneTiles = ["left", "center", "right"] as const;
const distantKrathongs = [
  { x: 7, y: 30, size: 24, design: "lotus" },
  { x: 17, y: 66, size: 47, design: "thai-06" },
  { x: 28, y: 23, size: 21, design: "moonlight" },
  { x: 37, y: 42, size: 38, design: "lotus" },
  { x: 48, y: 30, size: 26, design: "thai-06" },
  { x: 56, y: 75, size: 52, design: "moonlight" },
  { x: 66, y: 25, size: 22, design: "lotus" },
  { x: 74, y: 54, size: 40, design: "thai-06" },
  { x: 85, y: 32, size: 28, design: "moonlight" },
  { x: 94, y: 70, size: 48, design: "lotus" },
];
const stars = Array.from({ length: 48 }, (_, index) => ({
  x: `${2 + ((index * 137.508) % 96)}%`,
  y: `${3 + ((index * 17.37) % 48)}%`,
  size: index % 7 === 0 ? "2.5px" : index % 3 === 0 ? "1.8px" : "1px",
  opacity: .25 + (index % 5) * .09,
}));

/** Each named layer can move independently without moving the temple or people. */
export default function FestivalHeroScene({ paused, coupleIndex, changeCouple, openCreator }: {
  paused: boolean;
  coupleIndex: number;
  changeCouple: (direction: -1 | 1) => void;
  openCreator: () => void;
}) {
  const selectedCouple = pierCouples[coupleIndex];
  const nearbyCouples = [-1, 0, 1].map(offset =>
    pierCouples[(coupleIndex + offset + pierCouples.length) % pierCouples.length],
  );

  return <><div className={`festival-hero-layers photo-scene${paused ? " is-scene-paused" : ""}`} aria-hidden="true">
    <div className="hero-sky-layer" data-scene-layer="sky" />
    <div className="hero-stars-layer" data-scene-layer="stars">{stars.map((star, index) => <span key={index} style={{ left: star.x, top: star.y, width: star.size, height: star.size, opacity: star.opacity }} />)}</div>
    <div className="hero-moon-layer" data-scene-layer="full-moon"><span className="hero-moon-glow" /><Image src="/images/oldsiam-moon.webp" alt="" width={194} height={194} sizes="(max-width:760px) 54px, 150px" className="hero-full-moon" /></div>
    <div className="hero-temple-layer" data-scene-layer="temple"><div className="hero-temple-strip">{sceneTiles.map(side => <Image key={side} className={`hero-clean-plate tile-${side}`} src="/images/hero-layers/wat-arun-skyline-photo.png" alt="" width={1280} height={854} sizes="(max-width: 760px) 1800px, 100vw" preload={side === "center"} loading={side === "center" ? undefined : "eager"} />)}</div></div>
    <div className="hero-water-layer" data-scene-layer="water-reflections">
      {Array.from({ length: 20 }, (_, index) => <span key={index} className="hero-water-band" style={{ "--band": index, "--band-duration": `${2.5 + (index % 5) * .4}s`, "--band-delay": `${-index * .43}s`, "--band-drift": `${3 + (index % 4) * 2}px` } as CSSProperties}><span className="hero-water-strip">{sceneTiles.map(side => <span key={side} className={`hero-water-tile tile-${side}`} />)}</span></span>)}
      <span className="hero-water-glow" /><span className="hero-water-current" />
      <div className="hero-distant-krathongs" data-scene-layer="distant-krathongs">
        {distantKrathongs.map(({ x, y, size, design }, index) => (
          <span key={x} className="hero-distant-krathong" style={{
            "--float-x": `${x}cqw`,
            "--float-phase": x / 100,
            "--float-y": `${y}%`,
            "--float-size": `${size}px`,
            "--float-bob-delay": `${-index * .7}s`,
          } as CSSProperties}>
            <Image src={krathongImage(design)} alt="" width={64} height={64} sizes="(max-width:760px) 48px, 68px" />
          </span>
        ))}
      </div>
    </div>
    <div className="hero-fireworks-layer" data-scene-layer="fireworks">{fireworks.map((firework, index) => <div key={index} className={`hero-firework${firework.pink ? " is-pink" : ""}`} style={{ "--effect-x": firework.x, "--effect-y": firework.y, "--effect-size": firework.size, "--effect-duration": firework.duration, "--effect-delay": firework.delay } as CSSProperties}>
      <span className="hero-firework-rocket" /><Image src="/images/hero-layers/firework.png" alt="" width={512} height={512} sizes="220px" className="hero-firework-burst" />
    </div>)}</div>
    <div className="hero-lanterns-layer" data-scene-layer="yi-peng-lanterns">{lanterns.map((lantern, index) => <div key={index} className="hero-sky-lantern" style={{ "--lantern-x": lantern.x, "--lantern-size": lantern.size, "--lantern-duration": lantern.duration, "--lantern-delay": lantern.delay, "--lantern-drift": lantern.drift } as CSSProperties}><Image src="/images/hero-layers/lantern.png" alt="" width={256} height={384} sizes="64px" /></div>)}</div>
  </div>
    <div className={`hero-foreground-group${paused ? " is-scene-paused" : ""}`}>
      <div className="hero-pavilion-layer" data-scene-layer="pavilion-pier">
        <Image src="/images/hero-layers/foreground-pavilion-pier.png" alt="" width={1122} height={1402} sizes="(max-width:760px) 273px, 441px" preload />
        <div className="hero-pier-picker" role="group" aria-label="เลือกภาพตัวละครบนท่าน้ำ"
          onKeyDown={event => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            changeCouple(event.key === "ArrowLeft" ? -1 : 1);
          }}>
          {nearbyCouples.map(couple => (
            <Image key={couple.src} className="hero-pier-couple" src={couple.src} alt=""
              width={couple.width} height={couple.height} sizes="(max-width:760px) 160px, 290px"
              loading="eager" data-active={couple === selectedCouple} data-solo={!couple.key.endsWith("-pair")} />
          ))}
          <button type="button" className="hero-pier-arrow is-previous" aria-label="ภาพก่อนหน้า" onClick={() => changeCouple(-1)} />
          <button type="button" className="hero-pier-arrow is-next" aria-label="ภาพถัดไป" onClick={() => changeCouple(1)} />
          <span className="hero-pier-status" role="status">{selectedCouple.label}</span>
          <button type="button" className="hero-pier-create" onClick={openCreator} aria-haspopup="dialog">
            เขียนคำอธิษฐาน
          </button>
        </div>
      </div>
    </div>
  </>;
}



