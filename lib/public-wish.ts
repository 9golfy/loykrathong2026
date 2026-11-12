import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { withCurrentKrathong } from "./krathong-designs";

export const getPublicWish = cache(async (token: string) => {
  try {
    const wish = await prisma.submission.findFirst({
      where: { shareToken: token, isPublic: true, status: "APPROVED", campaign: { slug: "loy-krathong-2026" } },
      select: { id: true, nickname: true, wish: true, shareToken: true, design: { select: { key: true, name: true } } },
    });
    return wish ? withCurrentKrathong(wish) : null;
  } catch { return null; }
});
