"use client";

import { useEffect, useRef, useState } from "react";
import { festivalEvents as defaultEvents, type FestivalEvent } from "@/lib/festival-events";
import { thaiNumerals } from "@/lib/thai-numerals";
import { thailandOutline } from "@/lib/thailand-outline";

export function Lotus({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 64 42" fill="none" aria-hidden="true"><path d="M32 35C18 25 23 11 32 3c9 8 14 22 0 32Z"/><path d="M31 36C15 36 7 25 8 13c14 1 22 9 23 23ZM33 36c16 0 24-11 23-23-14 1-22 9-23 23Z"/><path d="M32 37C15 43 4 33 2 24c10-2 23 2 30 13Zm0 0c17 6 28-4 30-13-10-2-23 2-30 13Z"/></svg>;
}

// Spread nearby province pins without changing the underlying province anchors.
const provincePins = defaultEvents.filter((event, index, all) => event.coordinates && all.findIndex(item => item.province === event.province) === index).reduce<Record<string, { x: number; y: number; anchorX: number; anchorY: number }>>((pins, event) => {
  const anchorX = (event.coordinates![0] - 97) * 42;
  const anchorY = (21 - event.coordinates![1]) * 42;
  let x = anchorX, y = anchorY;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (Object.values(pins).every(pin => Math.hypot(pin.x - x, pin.y - y) >= 38)) break;
    const radius = 22 + Math.floor(attempt / 12) * 14;
    const angle = attempt * Math.PI / 6;
    x = Math.max(20, Math.min(370, anchorX + Math.cos(angle) * radius));
    y = Math.max(25, Math.min(650, anchorY + Math.sin(angle) * radius));
  }
  pins[event.province] = { x, y, anchorX, anchorY };
  return pins;
}, {});

function EventArt({ event }: { event: FestivalEvent }) {
  return <div className="event-province-banner"><Lotus /><p>{event.province}</p></div>;
}

export default function FestivalEvents() {
  const [festivalEvents, setFestivalEvents] = useState(defaultEvents);
  const [heading, setHeading] = useState({ title: "ปักหมุดลอยกระทง พุทธศักราช ๒๕๖๙", subtitle: "ลอยกระทง ไท ไทย สืบสานคุณค่า สู่คนรุ่นใหม่" });
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/festival-events", { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        if (!controller.signal.aborted) { setFestivalEvents(data.events); setHeading(data.heading); }
      } catch { /* Preserve the last loaded event list during a network interruption. */ }
    }
    void refresh();
    const timer = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  const [region, setRegion] = useState("ทุกภูมิภาค");
  const [province, setProvince] = useState("ทุกจังหวัด");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(festivalEvents[0].id);
  const [hovered, setHovered] = useState<string | null>(null);
  const [detail, setDetail] = useState<FestivalEvent | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const regional = festivalEvents.filter(event => region === "ทุกภูมิภาค" || event.region === region);
  const provinces = [...new Set(regional.map(event => event.province))];
  const visible = regional.filter(event => province === "ทุกจังหวัด" || event.province === province);
  const pageCount = Math.ceil(visible.length / 6);
  const pageEvents = visible.slice(page * 6, (page + 1) * 6);
  const mapEvents = regional.filter((event, index, all) => event.coordinates && all.findIndex(item => item.province === event.province) === index);
  const activeId = hovered ?? selected;
  const active = regional.find(event => event.id === hovered) ?? pageEvents.find(event => event.id === activeId) ?? pageEvents[0];

  useEffect(() => {
    if (!detail) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [detail]);

  function selectProvince(id: string) {
    const event = festivalEvents.find(item => item.id === id)!;
    setProvince(event.province);
    setPage(0);
    setSelected(id);
    setHovered(null);
  }

  function showDetails(event: FestivalEvent) {
    setSelected(event.id);
    setDetail(event);
    dialogRef.current?.showModal();
  }

  return <section className="destination-section" id="events" aria-labelledby="events-heading">
    <div className="festival-container">
      <header className="destination-heading"><Lotus /><div><h2 id="events-heading">{thaiNumerals(heading.title)}</h2><p>{thaiNumerals(heading.subtitle)}</p></div></header>
      <div className="event-toolbar"><label className="region-filter"><span aria-hidden="true">▽</span><select aria-label="กรองงานตามภูมิภาค" value={region} onChange={e => { setRegion(e.target.value); setProvince("ทุกจังหวัด"); setPage(0); setHovered(null); }}>
        {["ทุกภูมิภาค", "ภาคเหนือ", "ภาคกลาง", "ภาคตะวันออกเฉียงเหนือ", "ภาคตะวันออก", "ภาคตะวันตก", "ภาคใต้", "ต่างประเทศ", "ยังไม่ระบุจังหวัด"].map(item => <option key={item}>{item}</option>)}
      </select></label><label className="region-filter"><span aria-hidden="true">⌖</span><select aria-label="กรองงานตามจังหวัด" value={province} onChange={e => { setProvince(e.target.value); setPage(0); setHovered(null); }}>{["ทุกจังหวัด", ...provinces].map(item => <option key={item}>{item}</option>)}</select></label><span className="event-total" role="status">รวม <strong>{thaiNumerals(visible.length)}</strong> งาน</span></div>
      <div className="destination-grid">
        <div className="map-column"><div className="thailand-map" role="group" aria-label="แผนที่เลือกจังหวัดจัดงานลอยกระทง">
          <svg viewBox="0 0 390 680" className="map-outline" aria-hidden="true"><defs><linearGradient id="map-gold" x2="1" y2="1"><stop stopColor="#e9cc70"/><stop offset="1" stopColor="#897f39"/></linearGradient><pattern id="map-texture" width="28" height="32" patternUnits="userSpaceOnUse"><path d="M14 0 28 8v16l-14 8L0 24V8Z" fill="none" stroke="#fce4a4" strokeOpacity=".25" strokeWidth="1"/></pattern></defs><path d={thailandOutline} fill="url(#map-gold)" stroke="#ffe5a2" strokeWidth="2"/><path d={thailandOutline} fill="url(#map-texture)"/></svg>
          <svg className="map-pin-connectors" viewBox="0 0 390 680" aria-hidden="true">{mapEvents.map(event => { const pin = provincePins[event.province]; return <line key={event.province} x1={pin.anchorX} y1={pin.anchorY} x2={pin.x} y2={pin.y} />; })}</svg>{mapEvents.map(event => <button key={event.province} type="button" className={`map-pin ${active?.province === event.province ? "is-active" : ""}`} style={{ left: `${provincePins[event.province].x / 390 * 100}%`, top: `${provincePins[event.province].y / 680 * 100}%` }} aria-label={`เลือกจังหวัด${event.province}`} aria-pressed={province === event.province} onMouseEnter={() => setHovered(event.id)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(event.id)} onBlur={() => setHovered(null)} onClick={() => selectProvince(event.id)}><svg viewBox="0 0 24 30" aria-hidden="true"><path d="M12 28S2 18 2 11a10 10 0 0 1 20 0c0 7-10 17-10 17Z"/><circle cx="12" cy="11" r="4"/></svg><span>{event.province}</span></button>)}
        </div><div className="map-selection" aria-live="polite"><span className="map-selection-label">พื้นที่จัดงาน</span><strong>{active.province}</strong><span>{thaiNumerals(active.name)}</span><button type="button" onClick={() => showDetails(active)}>ดูรายละเอียดงาน <span>↗</span></button></div><p className="map-hint">แตะหรือชี้ที่หมุด เพื่อเลือกจังหวัด</p></div>
        <div className="event-results"><div className="province-grid">{pageEvents.map(event => <article id={`event-${event.id}`} key={event.id} className={`province-card ${active.id === event.id ? "is-active" : ""}`} onMouseEnter={() => setHovered(event.id)} onMouseLeave={() => setHovered(null)}>
          <div className="province-content"><span className="province-region">{event.region}</span><h3>{event.province}</h3><p className="province-event-name">{thaiNumerals(event.name)}</p><p className="event-meta"><span aria-hidden="true">▦</span>{thaiNumerals(event.date)}</p><p className="event-meta"><span aria-hidden="true">⌖</span>{thaiNumerals(event.location)}</p><button className="event-detail-button" type="button" aria-label={`ดูรายละเอียด ${event.name} ${event.location}`} onFocus={() => setHovered(event.id)} onBlur={() => setHovered(null)} onClick={() => showDetails(event)}>ดูรายละเอียด <span>›</span></button></div>
        </article>)}</div>{pageCount > 1 && <nav className="event-pagination" aria-label="หน้ารายการงาน"><button disabled={page === 0} onClick={() => { setPage(page - 1); setHovered(null); }}>‹ ก่อนหน้า</button><span role="status">หน้า {thaiNumerals(page + 1)} / {thaiNumerals(pageCount)}</span><button disabled={page + 1 >= pageCount} onClick={() => { setPage(page + 1); setHovered(null); }}>ถัดไป ›</button></nav>}</div>
      </div>
    </div>
    <dialog className="event-dialog" ref={dialogRef} aria-labelledby="event-detail-title" onClose={() => setDetail(null)} onClick={e => { if (e.target === e.currentTarget) dialogRef.current?.close(); }}>
      {detail && <><EventArt event={detail} /><button className="event-dialog-close" aria-label="ปิดรายละเอียดงาน" onClick={() => dialogRef.current?.close()}>×</button><div className="event-dialog-body"><span className="province-region">{detail.region} · {detail.province}</span><h2 id="event-detail-title">{thaiNumerals(detail.name)}</h2>{detail.description && <p>{thaiNumerals(detail.description)}</p>}<dl><dt>วันที่จัดงาน</dt><dd>{thaiNumerals(detail.date)}</dd><dt>สถานที่</dt><dd>{thaiNumerals(detail.location)}</dd></dl>{detail.dateNote && <p className="event-reference-notice">{thaiNumerals(detail.dateNote)}</p>}<a className="gold-button" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detail.location + " " + (detail.coordinates ? detail.province : ""))}`} target="_blank" rel="noreferrer">ค้นหาสถานที่บนแผนที่ <span>↗</span></a></div></>}
    </dialog>
  </section>;
}

