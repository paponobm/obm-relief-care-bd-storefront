const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

// Every storefront digit is shown in plain English numerals now — this used
// to swap 0-9 for their Bengali numeral, but callers (prices, quantities,
// counts, etc.) still run their value through here, so it stays a no-op
// pass-through rather than ripping out every call site.
export function bn(input: string | number): string {
  return String(input);
}

// Reverse of bn() plus digit extraction — pulls the numeric amount out of an
// admin-entered, Bengali-digit tier label like "৳১,২০০+" (-> 1200). Ignores
// everything that isn't a Bengali or Latin digit.
export function bnToNumber(input: string): number {
  const latin = String(input).replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
  const digits = latin.replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}
