type PierCouple = { key: string; label: string; width: number; height: number; src: string };

const outfitImages = [
  ["amarin-pair", "ชุดไทยอัมรินทร์ ชาย-หญิง", 1254, 1254],
  ["amarin", "ชุดไทยอัมรินทร์", 1134, 1387],
  ["royal-shirt-orange", "ชุดเสื้อพระราชทานแขนยาว สีส้ม", 1134, 1387],
  ["royal-shirt-blue", "ชุดเสื้อพระราชทานแขนยาวสีฟ้า", 1134, 1387],
  ["royal-shirt-short", "ชุดเสื้อพระราชทานแขนสั้น", 1134, 1387],
  ["chakkraphat-pair", "ชุดไทยจักรพรรดิ ชาย-หญิง", 1254, 1254],
  ["chakkraphat", "ชุดไทยจักรพรรดิ", 1134, 1387],
  ["chakkri-pair", "ชุดไทยจักรี ชาย-หญิง", 1254, 1254],
  ["chakkri", "ชุดไทยจักรี", 1134, 1387],
  ["chitralada-pair", "ชุดไทยจิตรลดา ชาย-หญิง", 1254, 1254],
  ["chitralada", "ชุดไทยจิตรลดา", 1134, 1387],
  ["dusit-pair", "ชุดไทยดุสิต ชาย-หญิง", 1254, 1254],
  ["dusit", "ชุดไทยดุสิต", 1134, 1387],
  ["boromphiman-pair", "ชุดไทยบรมพิมาน ชาย-หญิง", 1254, 1254],
  ["boromphiman", "ชุดไทยบรมพิมาน", 1134, 1387],
  ["rueanton-pair", "ชุดไทยเรือนต้น ชาย-หญิง", 1254, 1254],
  ["rueanton", "ชุดไทยเรือนต้น", 1134, 1387],
  ["siwalai-pair", "ชุดไทยศิวาลัย ชาย-หญิง", 1254, 1254],
  ["siwalai", "ชุดไทยศิวาลัย", 1134, 1387],
] as const;

export const pierCouples: PierCouple[] = outfitImages.map(([key, label, width, height]) => ({
  key,
  label,
  width,
  height,
  src: "/images/pier-outfits/" + encodeURIComponent(label + ".png"),
}));

const legacyPierCoupleKeys = new Map([
  ["green-orange", "chakkri-pair"],
  ["green-blue", "chitralada-pair"],
  ["gold-blue", "siwalai-pair"],
]);

export function getPierCouple(key: unknown) {
  if (typeof key !== "string") return undefined;
  const currentKey = legacyPierCoupleKeys.get(key) ?? key;
  return pierCouples.find(couple => couple.key === currentKey);
}

export const defaultPierCouple = getPierCouple("green-orange") ?? pierCouples[0];
