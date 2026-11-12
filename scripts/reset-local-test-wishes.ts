import dotenv from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { krathongDesigns } from "../lib/krathong-designs";
import { countWishWords, MAX_WISH_WORDS } from "../lib/wish-limits";

dotenv.config({ path: ".env", quiet: true });
dotenv.config({ path: ".env.local", override: true, quiet: true });

async function main() {
  if (!process.argv.includes("--replace-local-wishes")) throw new Error("Explicit --replace-local-wishes flag required");
  const connectionString = process.env.DATABASE_URL!;
  if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(connectionString).hostname)) throw new Error("Refusing to reset a non-local database");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const slug = "loy-krathong-2026";
    const campaign = await db.campaign.findUniqueOrThrow({ where: { slug } });
    const previous = await db.submission.findMany({ where: { campaignId: campaign.id }, include: { reports: true, design: true } });
    const directory = "output/local-data-backups";
    await mkdir(directory, { recursive: true });
    const backup = `${directory}/wishes-before-reset-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    await writeFile(backup, JSON.stringify({ campaign, submissions: previous }, null, 2));
    const fixtures = [
      ["ทดสอบ-อิ่มใจ", "ขอให้ครอบครัวมีความสุข สุขภาพแข็งแรง และได้ใช้เวลาดี ๆ ร่วมกัน"],
      ["ทดสอบ-สายธาร", "ขอให้ความทุกข์ลอยไปกับสายน้ำ และเริ่มต้นวันใหม่ด้วยรอยยิ้ม"],
      ["ทดสอบ-แสงดาว", "ขอให้การงานราบรื่น ได้พบโอกาสดี และสำเร็จตามความตั้งใจ"],
      ["ทดสอบ-ใบตอง", "ขอให้สายน้ำสะอาด ธรรมชาติอุดมสมบูรณ์ และทุกคนช่วยกันรักษาสิ่งแวดล้อม"],
      ["ทดสอบ-พราวฟ้า", "ขอให้มีสติและกำลังใจ ก้าวผ่านอุปสรรค และเติบโตอย่างงดงาม"],
      ["ทดสอบ-พิมพ์ใจ", "ขอให้คนที่รักมีแต่ความสุข และอยู่เคียงข้างกันนาน ๆ"],
    ];
    for (const [, wish] of fixtures) if (wish.length > 100 || countWishWords(wish) > MAX_WISH_WORDS) throw new Error("Fixture exceeds wish limits");
    const result = await db.$transaction(async tx => {
      const designs = [];
      for (const { image: _image, ...design } of krathongDesigns) {
        void _image;
        designs.push(await tx.krathongDesign.upsert({ where: { key: design.key }, update: { ...design, isActive: true }, create: design }));
      }
      await tx.krathongDesign.updateMany({ where: { key: { notIn: krathongDesigns.map(design => design.key) } }, data: { isActive: false } });
      const deleted = await tx.submission.deleteMany({ where: { campaignId: campaign.id } });
      for (const [index, [nickname, wish]] of fixtures.entries()) {
        await tx.submission.create({ data: { campaignId: campaign.id, designId: designs[index].id, nickname, wish, isPublic: true, status: "APPROVED" } });
      }
      return { removed: deleted.count, created: fixtures.length };
    });
    console.log(JSON.stringify({ scope: "localhost only", ...result, approved: await db.submission.count({ where: { campaignId: campaign.id, status: "APPROVED" } }), backup }));
  } finally { await db.$disconnect(); }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
