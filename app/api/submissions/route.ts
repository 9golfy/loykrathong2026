import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSelectableKrathong, withCurrentKrathong } from "@/lib/krathong-designs";
import { countWishWords, MAX_WISH_WORDS, MAX_WISH_LENGTH, MAX_NICKNAME_LENGTH } from "@/lib/wish-limits";
import { WISHES_PER_PAGE } from "@/lib/wish-pagination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const publicApproved = { campaign: { slug: "loy-krathong-2026" }, isPublic: true, status: "APPROVED" as const };
const newestFirst = [{ createdAt: "desc" }, { id: "desc" }] as const;

export async function GET(request: Request) {
  const pageParam = new URL(request.url).searchParams.get("page");
  const parsedPage = Number(pageParam);
  const requestedPage = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  try {
    const [wishPage, riverKrathongs] = await Promise.all([
      prisma.$transaction(async (db) => {
        const count = await db.submission.count({ where: publicApproved });
        const pageCount = Math.max(1, Math.ceil(count / WISHES_PER_PAGE));
        const page = Math.min(requestedPage, pageCount);
        const submissions = await db.submission.findMany({
          where: publicApproved,
          orderBy: [...newestFirst],
          skip: (page - 1) * WISHES_PER_PAGE,
          take: pageParam === null ? 8 : WISHES_PER_PAGE,
          select: { id: true, nickname: true, wish: true, shareToken: true, design: { select: { key: true, emoji: true, name: true } }, createdAt: true },
        });
        return { count, page, pageCount, submissions: submissions.map(withCurrentKrathong) };
      }, { isolationLevel: "RepeatableRead" }),
      prisma.submission.findMany({
        where: publicApproved,
        orderBy: [...newestFirst],
        take: 24,
        select: { id: true, nickname: true, wish: true, shareToken: true, design: { select: { key: true, name: true } } },
      }),
    ]);
    return NextResponse.json({ ...wishPage, riverKrathongs: riverKrathongs.map(withCurrentKrathong) });
  } catch {
    return NextResponse.json({ count: 0, submissions: [], riverKrathongs: [], databaseReady: false });
  }
}

export async function POST(request: Request) {
  let body: { designKey?: unknown; nickname?: unknown; wish?: unknown; isPublic?: unknown };
  try {
    const input: unknown = await request.json();
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid submission");
    body = input;
  } catch {
    return NextResponse.json({ error: "ข้อมูลที่ส่งมาไม่ถูกต้อง" }, { status: 400 });
  }

  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
  const wish = typeof body.wish === "string" ? body.wish.trim() : "";
  const designKey = typeof body.designKey === "string" ? body.designKey : "";
  if (!isSelectableKrathong(designKey)) {
    return NextResponse.json({ error: "กรุณาเลือกกระทงจาก ๑๐ แบบที่เปิดให้เลือก" }, { status: 400 });
  }
  if (nickname.length > MAX_NICKNAME_LENGTH) {
    return NextResponse.json({ error: "ชื่อผู้ส่งต้องไม่เกิน ๓๐ ตัวอักษรรวมช่องว่าง" }, { status: 400 });
  }
  if (wish.length > MAX_WISH_LENGTH) {
    return NextResponse.json({ error: "คำอธิษฐานต้องไม่เกิน ๑๐๐ อักขระรวมช่องว่าง" }, { status: 400 });
  }
  if (!nickname || !wish || !designKey) {
    return NextResponse.json({ error: "กรุณากรอกชื่อ คำอธิษฐาน และเลือกแบบกระทงให้ครบ" }, { status: 400 });
  }
  const wordCount = countWishWords(wish);
  if (wordCount === 0 || wordCount > MAX_WISH_WORDS) {
    return NextResponse.json({ error: "กรุณาเขียนคำอธิษฐาน ๑–๒๒ คำ (ไม่นับ ๆ เป็นคำ)" }, { status: 400 });
  }

  try {
    const [campaign, design] = await Promise.all([
      prisma.campaign.findUnique({ where: { slug: "loy-krathong-2026" } }),
      prisma.krathongDesign.findUnique({ where: { key: designKey } }),
    ]);
    if (!campaign?.isActive || !design?.isActive) {
      return NextResponse.json({ error: "กิจกรรมหรือแบบกระทงนี้ยังไม่พร้อมใช้งาน" }, { status: 409 });
    }
    const isPublic = body.isPublic === true;
    const submission = await prisma.submission.create({
      data: {
        campaignId: campaign.id,
        designId: design.id,
        nickname,
        wish,
        isPublic,
        status: isPublic ? "APPROVED" : "PENDING",
      },
      select: { id: true, nickname: true, wish: true, shareToken: true, design: { select: { key: true, emoji: true, name: true } }, createdAt: true },
    });
    return NextResponse.json({ submission: { id: submission.id }, publishedWish: isPublic ? withCurrentKrathong(submission) : null }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "ระบบบันทึกคำอธิษฐานขัดข้อง กรุณาลองใหม่อีกครั้ง" }, { status: 503 });
  }
}
