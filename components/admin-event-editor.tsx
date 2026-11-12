"use client";

import { useActionState, useState } from "react";
import { saveEvent, saveHeading } from "@/app/admin/events/actions";
import type { FestivalEvent } from "@/lib/festival-events";

const initial = { success: false, message: "" };
export function HeadingEditor({ heading }: { heading: { title: string; subtitle: string } }) {
  const [state, action, pending] = useActionState(saveHeading, initial);
  return <form action={action} className="admin-content-form">
    <h2>หัวข้อส่วนปักหมุด</h2>
    <label>หัวข้อหลัก<input name="title" defaultValue={heading.title} required maxLength={180} /></label>
    <label>คำโปรย<textarea name="subtitle" defaultValue={heading.subtitle} required maxLength={300} rows={2} /></label>
    <button className="admin-primary" disabled={pending}>{pending ? "กำลังบันทึก…" : "บันทึกหัวข้อ"}</button>
    {state.message && <p role="status" className={state.success ? "admin-save-success" : "admin-save-error"}>{state.message}</p>}
  </form>;
}
function EventEditor({ event }: { event: FestivalEvent }) {
  const [state, action, pending] = useActionState(saveEvent, initial);
  return <details className="admin-event-row"><summary><strong>{event.province}</strong><span>{event.name}</span></summary>
    <form action={action} className="admin-content-form">
      <input type="hidden" name="id" value={event.id} />
      <p className="admin-description">{event.region} · {event.province}</p>
      <label>ชื่องาน<textarea name="name" defaultValue={event.name} required maxLength={300} rows={2} /></label>
      <label>วันที่จัดงาน<input name="date" defaultValue={event.date} required maxLength={180} /></label>
      <label>สถานที่<textarea name="location" defaultValue={event.location} required maxLength={500} rows={2} /></label>
      <label>รายละเอียดเพิ่มเติม<textarea name="description" defaultValue={event.description} maxLength={3000} rows={4} /></label>
      <label>หมายเหตุกำหนดการ<textarea name="dateNote" defaultValue={event.dateNote} maxLength={500} rows={2} /></label>
      <button className="admin-primary" disabled={pending}>{pending ? "กำลังบันทึก…" : "บันทึกข้อมูลงาน"}</button>
      {state.message && <p role="status" className={state.success ? "admin-save-success" : "admin-save-error"}>{state.message}</p>}
    </form>
  </details>;
}
export default function AdminEventEditor({ events }: { events: FestivalEvent[] }) {
  const [search, setSearch] = useState("");
  const visible = events.filter(event => `${event.province} ${event.name}`.includes(search.trim()));
  return <section className="admin-event-list" aria-label="แก้ไขข้อมูลแต่ละงาน">
    <label className="admin-event-search">ค้นหาจังหวัดหรือชื่องาน<input value={search} onChange={event => setSearch(event.target.value)} placeholder="เช่น เชียงใหม่" /></label>
    <p className="admin-description">พบ {visible.length} งาน · เลือกงานเพื่อแก้ไขข้อความ</p>
    {visible.map(event => <EventEditor event={event} key={event.id} />)}
    {!visible.length && <p className="admin-empty">ไม่พบงานที่ตรงกับคำค้นหา</p>}
  </section>;
}
