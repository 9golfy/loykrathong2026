"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { festivalEvents } from "@/lib/festival-events";

type SaveState = { success: boolean; message: string };
function field(form: FormData, key: string, max: number, required = true) {
  const raw = form.get(key);
  if (typeof raw !== "string") throw new Error("invalid");
  const value = raw.trim();
  if ((required && !value) || value.length > max) throw new Error("invalid");
  return value;
}
function refresh() {
  revalidatePath("/admin/events");
  revalidatePath("/api/festival-events");
  revalidatePath("/");
}
export async function saveHeading(_previous: SaveState, form: FormData): Promise<SaveState> {
  await requireAdmin();
  let data;
  try { data = { title: field(form, "title", 180), subtitle: field(form, "subtitle", 300) }; }
  catch { return { success: false, message: "กรอกหัวข้อและคำโปรยให้ครบ โดยไม่เกินความยาวที่กำหนด" }; }
  try {
    await prisma.festivalSectionContent.upsert({ where: { id: "loy-krathong-2026" }, create: { id: "loy-krathong-2026", ...data }, update: data });
    refresh();
    return { success: true, message: "บันทึกหัวข้อแล้ว หน้าเว็บจะอัปเดตภายใน ๑๕ วินาที" };
  } catch { return { success: false, message: "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง" }; }
}
export async function saveEvent(_previous: SaveState, form: FormData): Promise<SaveState> {
  await requireAdmin();
  const id = form.get("id");
  if (typeof id !== "string" || !festivalEvents.some(event => event.id === id)) return { success: false, message: "ไม่พบงานที่ต้องการแก้ไข" };
  let data;
  try {
    data = { name: field(form, "name", 300), date: field(form, "date", 180), location: field(form, "location", 500), description: field(form, "description", 3000, false), dateNote: field(form, "dateNote", 500, false) };
  } catch { return { success: false, message: "กรอกชื่องาน วันที่ และสถานที่ให้ครบ โดยไม่เกินความยาวที่กำหนด" }; }
  try {
    await prisma.festivalEventContent.upsert({ where: { id }, create: { id, ...data }, update: data });
    refresh();
    return { success: true, message: "บันทึกข้อมูลงานแล้ว หน้าเว็บจะอัปเดตภายใน ๑๕ วินาที" };
  } catch { return { success: false, message: "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง" }; }
}
