import { krathongDesigns } from "../lib/krathong-designs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.campaign.upsert({
    where: { slug: "loy-krathong-2026" },
    update: {},
    create: {
      slug: "loy-krathong-2026",
      title: "ลอยกระทงออนไลน์",
      description: "ร่วมสืบสานประเพณีไทย ส่งคำอธิษฐานดี ๆ ให้ลอยไปกับสายน้ำ",
      isActive: true,
    },
  });

  for (const { key, name, description, emoji, palette } of krathongDesigns) {
    const design = { key, name, description, emoji, palette };
    await prisma.krathongDesign.upsert({ where: { key: design.key }, update: { ...design, isActive: true }, create: design });
  }
  await prisma.krathongDesign.updateMany({ where: { key: { notIn: krathongDesigns.map(design => design.key) } }, data: { isActive: false } });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
