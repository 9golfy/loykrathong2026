"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearAdminSession, createAdminSession, requireAdmin, verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function loginAction(_previous: { error: string }, form: FormData): Promise<{ error: string }> {
  const result = await verifyAdmin(String(form.get("username") ?? ""), String(form.get("password") ?? ""));
  if (result === "unconfigured") return { error: "ยังไม่ได้ตั้งค่าบัญชีผู้ดูแล กรุณาตรวจไฟล์ .env" };
  if (result === "throttled") return { error: "ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอ 5 นาที" };
  if (result !== "valid") return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  await createAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function moderateAction(form: FormData) {
  await requireAdmin();
  const id = form.get("id");
  const status = form.get("status");
  const previous = form.get("previous");
  if (typeof id !== "string" || id.length > 100 || !["PENDING", "APPROVED", "HIDDEN"].includes(String(previous)) || (status !== "PENDING" && status !== "APPROVED" && status !== "HIDDEN")) redirect("/admin?notice=invalid");
  const filter = form.get("filter");
  const target = filter === "HIDDEN" || filter === "PENDING" ? filter : "APPROVED";
  let updated;
  try {
    updated = await prisma.submission.updateMany({
      where: { id, isPublic: true, status: previous as "PENDING" | "APPROVED" | "HIDDEN", campaign: { slug: "loy-krathong-2026" } },
      data: { status },
    });
  } catch { redirect(`/admin?status=${target}&notice=error`); }
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/wish/[token]", "page");
  redirect(`/admin?status=${target}&notice=${updated.count ? "saved" : "stale"}`);
}
