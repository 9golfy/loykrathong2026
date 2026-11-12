import "server-only";
import { prisma } from "@/lib/prisma";
import { festivalEvents } from "@/lib/festival-events";

export const defaultFestivalHeading = {
  title: "ปักหมุดลอยกระทง พุทธศักราช ๒๕๖๙",
  subtitle: "ลอยกระทง ไท ไทย สืบสานคุณค่า สู่คนรุ่นใหม่",
};

export async function getFestivalContent() {
  const [heading, overrides] = await Promise.all([
    prisma.festivalSectionContent.findUnique({ where: { id: "loy-krathong-2026" } }),
    prisma.festivalEventContent.findMany(),
  ]);
  const byId = new Map(overrides.map(event => [event.id, event]));
  return {
    heading: heading ? { title: heading.title, subtitle: heading.subtitle } : defaultFestivalHeading,
    events: festivalEvents.map(event => {
      const saved = byId.get(event.id);
      return saved ? { ...event, name: saved.name, date: saved.date, location: saved.location, description: saved.description, dateNote: saved.dateNote } : event;
    }),
  };
}
