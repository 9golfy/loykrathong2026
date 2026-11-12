import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LoyKrathongExperience from "@/components/loy-krathong-experience";
import { getPublicWish } from "@/lib/public-wish";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const wish = await getPublicWish((await params).token);
  if (!wish) return { title: "ไม่พบคำอธิษฐาน | Loy Kratong 2026", robots: { index: false } };
  return {
    title: `คำอธิษฐานจาก ${wish.nickname} | Loy Kratong 2026`, description: wish.wish,
    openGraph: { title: `คำอธิษฐานจาก ${wish.nickname}`, description: wish.wish, type: "website", locale: "th_TH" },
    twitter: { card: "summary", title: `คำอธิษฐานจาก ${wish.nickname}`, description: wish.wish },
  };
}

export default async function SharedWishPage({ params }: Props) {
  const wish = await getPublicWish((await params).token);
  if (!wish) notFound();
  return <LoyKrathongExperience sharedWish={wish} />;
}
