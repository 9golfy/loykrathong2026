import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ลอยกระทงไทย 2569 | ลอยกระทงออนไลน์และงานทั่วไทย",
  description: "ร่วมสืบสานประเพณีลอยกระทง สร้างกระทงออนไลน์ ส่งคำอธิษฐาน และค้นหางานลอยกระทงทั่วไทย",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
