"use client";

import { useMemo } from "react";
import QRCode from "qrcode";

export default function WishQrCode({ url }: { url: string }) {
  const code = useMemo(() => {
    const { modules } = QRCode.create(url, { errorCorrectionLevel: "M" });
    let path = "";
    for (let y = 0; y < modules.size; y++) {
      for (let x = 0; x < modules.size; x++) {
        if (modules.get(y, x)) path += `M${x + 4},${y + 4}h1v1h-1z`;
      }
    }
    return { size: modules.size + 8, path };
  }, [url]);
  return <svg className="wish-qr-code" viewBox={`0 0 ${code.size} ${code.size}`} role="img" aria-label="QR Code เปิดการ์ดคำอธิษฐานนี้" shapeRendering="crispEdges"><rect width={code.size} height={code.size} fill="#fff" /><path d={code.path} fill="#082549" /></svg>;
}
