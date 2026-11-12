import Link from "next/link";
import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/admin-login-form";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return <main className="admin-shell admin-login-shell"><section className="admin-login-card">
    <Link href="/" className="admin-brand">✦ Loy Kratong 2026</Link>
    <p className="admin-eyebrow">CAMPAIGN ADMIN</p><h1>เข้าสู่ระบบผู้ดูแล</h1>
    <p className="admin-description">จัดการคำอธิษฐานและซ่อนรายการที่เผยแพร่แล้ว</p>
    <AdminLoginForm configured={adminConfigured()} />
    <Link href="/" className="admin-back">← กลับหน้าเว็บลอยกระทง</Link>
  </section></main>;
}
