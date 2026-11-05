const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

// Swaps 0-9 for their Bengali numeral — applied on top of an already
// Latin-formatted string (e.g. formatTaka's "৳1,234"), so commas/currency
// signs are left alone and only the digits themselves change.
export function bn(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}
