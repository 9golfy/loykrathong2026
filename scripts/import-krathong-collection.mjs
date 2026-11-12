import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const files = [
  "Intricate Thai Loy Krathong with Candle and Flowers-1.png",
  "Elaborate Thai Krathong with Candle and Flowers-2.png",
  "Thai Krathong with Candle and Floral Layers-3.png",
  "Ornate Thai Krathong with Flowers and Candle-4.png",
  "Ornate Thai Krathong with Candle and Flowers-5.png",
  "Thai Krathong with Lotus, Candle, and Incense-6.png",
  "Ornate Thai Krathong with Candle and Flowers-7.png",
  "Elaborate Thai Krathong with Candle and Flowers-8.png",
  "Ornate Thai Loy Krathong Float-9.png",
  "Vibrant Thai Lotus Krathong with Candle and Incense-10.png",
];
const output = new URL("../public/images/krathongs/collection-2569/", import.meta.url);
await mkdir(output, { recursive: true });
for (const [index, file] of files.entries()) {
  const number = String(index + 1).padStart(2, "0");
  await sharp(`C:/Users/ASUS/Downloads/${file}`).resize({ width: 1000, withoutEnlargement: true }).webp({ quality: 92, alphaQuality: 100 }).toFile(fileURLToPath(new URL(`design-${number}.webp`, output)));
  console.log(`Imported design ${number}`);
}
