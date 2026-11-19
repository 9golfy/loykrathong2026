import { thaiNumerals } from "./thai-numerals";

// Retain existing identifiers so saved wishes keep their database relationships.
const designKeys = [
  "lotus", "banana-leaf", "silk", "moonlight", "thai-05", "thai-06", "thai-07", "thai-08", "thai-09", "thai-10",
  "rice-stalk", "tiered-spire", "coconut-lotus", "flower-boat", "festival-barge",
];

const numberedDesigns = designKeys.map((key, index) => ({
  key,
  name: `กระทงมงคล ${thaiNumerals(String(index + 1).padStart(2, "0"))}`,
  description: "กระทงใบตองประดับดอกบัว กล้วยไม้ มะลิ และดาวเรือง",
  emoji: "🪷", palette: "leaf",
  image: `/images/krathongs/collection-2569/design-${String(index + 1).padStart(2, "0")}.webp`,
}));

const colorLotuses = [
  ["pink", "ชมพู"],
  ["purple", "ม่วง"],
  ["blue", "น้ำเงิน"],
  ["cyan", "ฟ้า"],
  ["lime", "เขียวอ่อน"],
  ["green", "เขียวเข้ม"],
] as const;

export const krathongDesigns = [...numberedDesigns, ...colorLotuses.map(([color, label]) => ({
  key: "lotus-color-" + color,
  name: "กระทงดอกบัวสี" + label,
  description: "กระทงดอกบัวสี" + label + " พร้อมเทียนและธูป",
  emoji: "🪷", palette: color,
  image: "/images/krathongs/lotus-colors/" + color + ".png",
}))];

export function isSelectableKrathong(key: string): boolean {
  return krathongDesigns.some(design => design.key === key);
}

export function getKrathongDesign(key: string) {
  const current = krathongDesigns.find(design => design.key === key);
  if (current) return current;
  // Retired designs use the new collection without deleting saved wishes.
  const retired = /^thai-(1[1-5])$/.exec(key);
  return krathongDesigns[retired ? (Number(retired[1]) - 1) % 10 : 0];
}

export function krathongImage(key: string) {
  return getKrathongDesign(key).image;
}

export function withCurrentKrathong<T extends { design: { key: string; name: string } }>(item: T) {
  const design = getKrathongDesign(item.design.key);
  return { ...item, design: { ...item.design, name: design.name } };
}
