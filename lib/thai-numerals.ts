/** Format interface numbers without changing underlying values or user content. */
export function thaiNumerals(value: string | number): string {
  return String(value).replace(/[0-9]/g, digit => "๐๑๒๓๔๕๖๗๘๙"[Number(digit)]);
}
