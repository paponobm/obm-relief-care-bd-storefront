// The symptom-finder quiz's own categories/sub-categories/products (QUIZ,
// KIT_MATCHES) moved to admin-curated data — see Settings → Badge &
// Category → Problem, served by GET /store/:slug/quiz and consumed by
// components/quiz-flow.tsx. COMPLEMENT below is a separate, still-hardcoded
// feature (the product page's "এর সাথে মানানসই" cross-sell pool, keyed by
// category name) and is unrelated to the quiz.

// Cross-sell pool shown on a product page, keyed by category NAME (Bengali)
// — the public product API returns {id, name} for category, no slug, so
// name is the only identifier available to match against here.
export const COMPLEMENT: Record<string, string[]> = {
  "ব্যথা উপশম": ["tiger-balm-red-ointment", "volini-gel", "poy-sian-inhaler", "original-zandu-balm"],
  "ত্বক ও চর্মরোগ": ["leeford-scrabic-permethrin-soap", "asepso-sport-antibacterial-soap", "snake-brand-cooling-powder", "itch-guard-plus-cream"],
  "সর্দি-কাশি ও গলা": ["strepsils-lozenges", "poy-sian-inhaler", "vicks-vaporub", "vicks-baby-rub"],
  "দাঁত ও মুখের যত্ন": ["oral-b-superfloss", "fresh-breath-mouth-spray", "charcoal-toothpaste"],
  "চুলের যত্ন": ["nizoral-anti-dandruff-shampoo", "mediker-anti-lice-shampoo", "indulekha-bringha-hair-oil"],
  "পায়ের যত্ন": ["vaseline-cocoa-butter", "asepso-sport-antibacterial-soap", "krack-heel-repair-cream", "dr-rhazes-foot-cream"],
  "মা ও শিশু": ["vicks-baby-rub", "dabur-lal-tail", "odomos-mosquito-cream"],
  "হারবাল ও সুস্থতা": ["himalaya-ashwagandha", "dabur-nature-care", "pain-relief-massage-oil"],
  "কম্বো অফার": ["poy-sian-inhaler", "original-zandu-balm", "strepsils-lozenges"],
};
