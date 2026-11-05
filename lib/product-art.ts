// Placeholder package art for products with no real photo yet — a plain
// colored silhouette, not a fabricated product photo. The color follows the
// category; the shape is guessed from the name only as a presentational cue.
// Keyed by category NAME (Bengali) since that's what the public product API
// returns — it has no category slug field.
export const CATEGORY_HUE: Record<string, string> = {
  "সমাধান কিট": "#7A4FB5",
  "ব্যথা উপশম": "#E7672A",
  "ত্বক ও চর্মরোগ": "#1F7A3A",
  "সর্দি-কাশি ও গলা": "#2F7FB8",
  "দাঁত ও মুখের যত্ন": "#2BA3A0",
  "চুলের যত্ন": "#8A5A2B",
  "পায়ের যত্ন": "#B8892A",
  "মা ও শিশু": "#C2457A",
  "হারবাল ও সুস্থতা": "#5C8A2B",
  "কম্বো অফার": "#F08A12",
};

type Shape = "jar" | "tube" | "bottle" | "spray" | "roll" | "box" | "soap";

function guessShape(name: string): Shape {
  const n = name.toLowerCase();
  if (n.includes("spray")) return "spray";
  if (n.includes("balm")) return "jar";
  if (n.includes("soap")) return "soap";
  if (n.includes("roll-on") || n.includes("roll")) return "roll";
  if (n.includes("floss") || n.includes("কিট") || n.includes("কম্বো") || n.includes("combo")) return "box";
  if (n.includes("cream") || n.includes("gel") || n.includes("ointment") || n.includes("powder")) return "tube";
  if (n.includes("oil") || n.includes("shampoo") || n.includes("syrup") || n.includes("wash") || n.includes("water"))
    return "bottle";
  return "tube";
}

const SHAPE_PATH: Record<Shape, (h: string) => string> = {
  jar: (h) =>
    `<rect x="58" y="62" width="84" height="18" rx="5" fill="${h}"/><rect x="52" y="78" width="96" height="66" rx="12" fill="#fff" stroke="${h}" stroke-width="3"/><rect x="52" y="96" width="96" height="30" fill="${h}" opacity=".9"/>`,
  tube: (h) =>
    `<path d="M60 52h80l-6 92H66z" fill="#fff" stroke="${h}" stroke-width="3"/><rect x="88" y="144" width="24" height="16" rx="3" fill="${h}"/><rect x="62" y="86" width="76" height="34" fill="${h}" opacity=".9"/>`,
  bottle: (h) =>
    `<rect x="88" y="34" width="24" height="20" rx="4" fill="${h}"/><path d="M80 54h40v10c10 4 16 12 16 22v66H64V86c0-10 6-18 16-22z" fill="#fff" stroke="${h}" stroke-width="3"/><rect x="64" y="96" width="72" height="36" fill="${h}" opacity=".9"/>`,
  spray: (h) =>
    `<rect x="86" y="30" width="28" height="16" rx="3" fill="${h}"/><rect x="80" y="46" width="40" height="10" fill="#fff" stroke="${h}" stroke-width="3"/><rect x="72" y="56" width="56" height="100" rx="10" fill="#fff" stroke="${h}" stroke-width="3"/><rect x="72" y="88" width="56" height="34" fill="${h}" opacity=".9"/>`,
  roll: (h) =>
    `<rect x="84" y="40" width="32" height="26" rx="10" fill="${h}"/><rect x="78" y="66" width="44" height="88" rx="10" fill="#fff" stroke="${h}" stroke-width="3"/><rect x="78" y="94" width="44" height="34" fill="${h}" opacity=".9"/>`,
  box: (h) =>
    `<rect x="50" y="56" width="100" height="92" rx="6" fill="#fff" stroke="${h}" stroke-width="3"/><path d="M50 56l12-14h76l12 14" fill="none" stroke="${h}" stroke-width="3"/><rect x="50" y="86" width="100" height="34" fill="${h}" opacity=".9"/>`,
  soap: (h) =>
    `<rect x="46" y="78" width="108" height="58" rx="22" fill="#fff" stroke="${h}" stroke-width="3"/><rect x="58" y="92" width="84" height="30" rx="12" fill="${h}" opacity=".9"/>`,
};

export function productArtSvg(name: string, categoryName: string | null): string {
  const hue = (categoryName && CATEGORY_HUE[categoryName]) || "#1F7A3A";
  const shape = guessShape(name);
  const label = name.split(/[\s(]/)[0].slice(0, 11).replace(/[<>&]/g, "");
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}"><rect width="200" height="200" fill="${hue}" opacity=".11"/><circle cx="100" cy="104" r="74" fill="${hue}" opacity=".08"/>${SHAPE_PATH[shape](hue)}<text x="100" y="118" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="13" fill="#fff">${label}</text><ellipse cx="100" cy="168" rx="52" ry="6" fill="#000" opacity=".07"/></svg>`;
}
