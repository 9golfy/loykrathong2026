import { drawWishCardTypography } from "./wish-card-typography";
import { wishCardSize } from "./wish-card-layout";

export async function downloadCompositeWishCard(card: HTMLElement) {
  const bounds = card.getBoundingClientRect();
  if (!bounds.width || !bounds.height) throw new Error("Card preview unavailable");

  const layers = [".wish-frame-background", ".wish-framed-couple", ".wish-framed-boat"];
  const images = await Promise.all(layers.map(async selector => {
    const preview = card.querySelector<HTMLImageElement>(selector);
    if (!preview) throw new Error("Card image unavailable");
    const source = new URL(preview.currentSrc || preview.src);
    const image = new Image();
    image.src = source.searchParams.get("url") ?? source.href;
    await image.decode();
    return { image, box: preview.getBoundingClientRect() };
  }));
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = wishCardSize.width;
  canvas.height = wishCardSize.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");

  context.save();
  context.scale(canvas.width / bounds.width, canvas.height / bounds.height);
  for (const { image, box } of images) {
    const scale = Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.drawImage(image, box.left - bounds.left + (box.width - width) / 2,
      box.top - bounds.top + (box.height - height) / 2, width, height);
  }
  context.restore();
  drawWishCardTypography(context, card);

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Export failed");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "คำอธิษฐาน-ลอยกระทง-๒๕๖๙.png";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
