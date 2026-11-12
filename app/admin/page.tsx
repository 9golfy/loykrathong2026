import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { krathongImage } from "@/lib/krathong-designs";
import AdminModerationForm from "@/components/admin-moderation-form";
import { logoutAction } from "./actions";

const labels = { APPROVED: "เผยแพร่แล้ว", HIDDEN: "ซ่อนแล้ว", PENDING: "รอตรวจสอบ", PRIVATE: "ส่วนตัว" };
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string; notice?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const filter = params.status === "HIDDEN" || params.status === "PENDING" || params.status === "PRIVATE" ? params.status : "APPROVED";
  const page = Math.max(1, Math.min(100000, Number.parseInt(params.page ?? "1", 10) || 1));
  const where = { campaign: { slug: "loy-krathong-2026" } };
  const [groups, rows] = await Promise.all([
    prisma.submission.groupBy({ by: ["status", "isPublic"], where, _count: { _all: true } }),
    prisma.submission.findMany({ where: { ...where, ...(filter === "PRIVATE" ? { isPublic: false } : { isPublic: true, status: filter }) }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 20, take: 20, select: { id: true, nickname: true, wish: true, isPublic: true, status: true, shareToken: true, createdAt: true, design: { select: { key: true, name: true } } } }),
  ]);
  const counts = { APPROVED: 0, HIDDEN: 0, PENDING: 0, PRIVATE: 0 };
  for (const group of groups) counts[group.isPublic ? group.status : "PRIVATE"] += group._count._all;
  const notices: Record<string, string> = { saved: "บันทึกสถานะแล้ว หน้าเว็บจะอัปเดตภายใน 15 วินาที", stale: "รายการนี้ถูกเปลี่ยนสถานะแล้ว กรุณาตรวจสอบอีกครั้ง", invalid: "ข้อมูลไม่ถูกต้อง กรุณาลองใหม่", error: "บันทึกไม่สำเร็จ กรุณาลองใหม่" };
  return <main className="admin-shell"><div className="admin-workspace">
    <header className="admin-header"><div><Link href="/" className="admin-brand">✦ Loy Kratong 2026</Link><h1>จัดการคำอธิษฐาน</h1><p>คำอธิษฐานที่ผู้ส่งเลือกเปิดเผยจะขึ้นหน้าเว็บทันที กดซ่อนเพื่อนำออกจากหน้าเว็บและปิดลิงก์แชร์</p></div><div className="admin-header-actions"><Link href="/" target="_blank" rel="noopener noreferrer">ดูหน้าเว็บ ↗</Link><form action={logoutAction}><button type="submit">ออกจากระบบ</button></form></div></header>
    <nav className="admin-tabs" aria-label="กรองตามสถานะ">{(Object.keys(labels) as Array<keyof typeof labels>).map((status) => <Link key={status} href={`/admin?status=${status}`} className={filter === status ? "active" : ""} aria-current={filter === status ? "page" : undefined}>{labels[status]} <span>{counts[status] ?? 0}</span></Link>)}<Link href="/admin/events">ปักหมุดลอยกระทง</Link></nav>
    {params.notice && notices[params.notice] && <p className="admin-notice" role="status">{notices[params.notice]}</p>}
    {filter === "PENDING" && <p className="admin-privacy-note">รายการที่รอตรวจสอบจะยังไม่แสดงบนหน้าเว็บจนกว่าจะกดเผยแพร่</p>}
    {filter === "PRIVATE" && <p className="admin-privacy-note">รายการส่วนตัวไม่แสดงบนหน้าเว็บและไม่มีลิงก์แชร์</p>}
    <section className="admin-submissions" aria-label={labels[filter]}>{rows.length ? rows.map((row) => <article className="admin-submission" key={row.id}>
      <Image src={krathongImage(row.design.key)} alt={row.design.name} width={110} height={110} />
      <div className="admin-submission-content"><div className="admin-submission-heading"><h2>{row.nickname}</h2><span className={`admin-visibility ${row.isPublic ? "" : "private"}`}>{row.isPublic ? "สาธารณะ" : "ส่วนตัว"}</span></div><p className="admin-wish">{row.wish}</p><p className="admin-submission-meta">{row.design.name} · {row.createdAt.toLocaleString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" })}</p>
      {row.isPublic && <AdminModerationForm id={row.id} status={row.status} filter={filter} />}
      {row.isPublic && row.status === "APPROVED" && <Link className="admin-share-preview" href={`/wish/${row.shareToken}`} target="_blank" rel="noopener noreferrer">เปิดคำอธิษฐานที่เผยแพร่ ↗</Link>}</div>
    </article>) : <div className="admin-empty"><span>✧</span><h2>ไม่มีรายการ{labels[filter]}</h2><p>เลือกแท็บอื่นเพื่อตรวจสอบกระทงที่เหลือ</p></div>}</section>
    <nav className="admin-pagination" aria-label="เปลี่ยนหน้า">{page > 1 && <Link href={`/admin?status=${filter}&page=${page - 1}`}>← ก่อนหน้า</Link>}<span>หน้า {page}</span>{page * 20 < (counts[filter] ?? 0) && <Link href={`/admin?status=${filter}&page=${page + 1}`}>ถัดไป →</Link>}</nav>
  </div></main>;
}
