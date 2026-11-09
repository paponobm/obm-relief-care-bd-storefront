const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

// Swaps 0-9 for their Bengali numeral — applied on top of an already
// Latin-formatted string (e.g. formatTaka's "৳1,234"), so commas/currency
// signs are left alone and only the digits themselves change.
export function bn(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

// Reverse of bn() plus digit extraction — pulls the numeric amount out of an
// admin-entered, Bengali-digit tier label like "৳১,২০০+" (-> 1200). Ignores
// everything that isn't a Bengali or Latin digit.
export function bnToNumber(input: string): number {
  const latin = String(input).replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
  const digits = latin.replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}
