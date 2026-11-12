export const MAX_WISH_WORDS = 22;
export const MAX_WISH_LENGTH = 100;
export const MAX_NICKNAME_LENGTH = 30;

const thaiWords = new Intl.Segmenter("th", { granularity: "word" });
const thaiCharacters = new Intl.Segmenter("th", { granularity: "grapheme" });

export function limitWishInput(text: string): string {
  const normalized = text.replace(/\s+/gu, " ");
  let limited = "";
  for (const part of thaiCharacters.segment(normalized)) {
    if (limited.length + part.segment.length > MAX_WISH_LENGTH) break;
    limited += part.segment;
  }
  let count = 0;
  for (const part of thaiWords.segment(limited)) {
    if (part.isWordLike && !/^ๆ+$/u.test(part.segment) && ++count > MAX_WISH_WORDS) {
      return limited.slice(0, part.index).trimEnd();
    }
  }
  return limited;
}

/** Count Thai/Latin words; spaces, punctuation and the repetition mark ๆ do not count. */
export function countWishWords(text: string): number {
  let count = 0;
  for (const part of thaiWords.segment(text)) {
    if (part.isWordLike && !/^ๆ+$/u.test(part.segment)) count++;
  }
  return count;
}
