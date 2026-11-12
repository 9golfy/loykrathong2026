"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions";

export default function AdminLoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(loginAction, { error: "" });
  return <form action={action} className="admin-login-form">
    <label htmlFor="admin-username">ชื่อผู้ใช้</label>
    <input id="admin-username" name="username" autoComplete="username" maxLength={100} required autoFocus />
    <label htmlFor="admin-password">รหัสผ่าน</label>
    <input id="admin-password" type="password" name="password" autoComplete="current-password" maxLength={256} required />
    {!configured && <p role="alert">ยังไม่ได้ตั้งค่าบัญชีผู้ดูแลใน .env</p>}
    {state.error && <p role="alert" className="admin-error">{state.error}</p>}
    <button className="admin-primary" type="submit" disabled={pending || !configured}>{pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}</button>
  </form>;
}
