import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getFestivalContent } from "@/lib/festival-content";
import { SHOW_FESTIVAL_EVENTS } from "@/lib/festival-events";
import AdminEventEditor, { HeadingEditor } from "@/components/admin-event-editor";
import { logoutAction } from "../actions";

export default async function AdminEventsPage() {
  await requireAdmin();
  const { heading, events } = await getFestivalContent();
  return <main className="admin-shell"><div className="admin-workspace">
    <header className="admin-header"><div><Link href="/admin" className="admin-brand">✦ Loy Kratong 2026</Link><h1>จัดการปักหมุดลอยกระทง</h1><p>แก้ไขหัวข้อ คำโปรย และข้อความของงานบนหน้าเว็บไซต์</p></div><div className="admin-header-actions">{SHOW_FESTIVAL_EVENTS && <Link href="/#events" target="_blank" rel="noopener noreferrer">ดูส่วนปักหมุด ↗</Link>}<form action={logoutAction}><button>ออกจากระบบ</button></form></div></header>
    <nav className="admin-tabs" aria-label="เมนูผู้ดูแล"><Link href="/admin">ตรวจคำอธิษฐาน</Link><Link href="/admin/events" className="active" aria-current="page">ปักหมุดลอยกระทง</Link></nav>
    <HeadingEditor heading={heading} />
    <AdminEventEditor events={events} />
  </div></main>;
}
