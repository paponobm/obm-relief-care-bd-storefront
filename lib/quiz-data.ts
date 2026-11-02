// Symptom-finder data, re-keyed from the original design's product ids to
// this storefront's real, stable product slugs (captured from the backend
// import script's output). Pure client-side matching against real catalog
// data — no backend dependency, nothing fabricated.

export interface QuizSub {
  label: string;
  slugs: string[];
  // Shown instead of/alongside slugs when the quiz-taker is shopping for a child.
  childSlugs?: string[];
}

export interface QuizProblem {
  label: string;
  desc: string;
  subs: Record<string, QuizSub>;
}

export const QUIZ: Record<string, QuizProblem> = {
  pain: {
    label: "ব্যথা",
    desc: "মাথা, ঘাড়, কোমর, জয়েন্ট",
    subs: {
      head: { label: "মাথাব্যথা বা মাইগ্রেন", slugs: ["amrutanjan-extra-power", "headache-relaxation-roll-on", "original-zandu-balm", "tiger-balm-white-ointment", "zandu-ultra-power-balm"] },
      back: { label: "ঘাড় বা কোমর ব্যথা", slugs: ["advanced-back-pain-roll-on", "volini-gel", "hot-strong-pain-relief-gel", "deep-heat-pain-relief-spray"] },
      joint: { label: "জয়েন্ট বা মাংসপেশির ব্যথা", slugs: ["volini-gel", "volini-pain-relief-spray", "cipla-omnigel", "tiger-balm-red-ointment", "green-seven-crocodile-balm"] },
      massage: { label: "মালিশের তেল বা বাম", slugs: ["pain-relief-massage-oil", "bio-active-ax-oil", "green-seven-herb-massage-balm", "radian-massage-cream"] },
    },
  },
  skin: {
    label: "চামড়ার সমস্যা",
    desc: "দাদ, চুলকানি, এলার্জি, ক্ষত",
    subs: {
      ring: { label: "দাদ বা গোল চুলকানি", slugs: ["stopderma-kt-cream", "skineal-cream", "salical-strong-ointment", "itch-guard-plus-cream", "leeford-scrabic-permethrin-soap"] },
      allergy: { label: "এলার্জি বা ফুসকুড়ি", slugs: ["two-snakes-cream", "clobeta-gm-cream", "itch-guard-plus-cream"] },
      wound: { label: "ছোট কাটা বা ক্ষত", slugs: ["mupixen-mupirocin-5g", "gsk-betnovate-n-cream-25g"] },
      heat: { label: "গরমে ঘামাচি", slugs: ["snake-brand-cooling-powder", "clotrimazole-dusting-powder", "asepso-sport-antibacterial-soap"] },
      wart: { label: "আঁচিল বা কর্ন", slugs: ["sumifun-wart-remover"] },
    },
  },
  face: {
    label: "মুখ ও ত্বকের সৌন্দর্য",
    desc: "ব্রণ, দাগ, মেছতা, ঠোঁট",
    subs: {
      acne: { label: "ব্রণ", slugs: ["argussy-acne-spot-remover", "bio-active-acne-clear-face-wash", "lemon-clear-dark-spot-cream"] },
      spot: { label: "কালো দাগ বা মেছতা", slugs: ["vin21-anti-melasma-cream", "lemon-clear-dark-spot-cream"] },
      lip: { label: "শুষ্ক ঠোঁট বা ত্বক", slugs: ["vaseline-rosy-lips-tin", "vaseline-cocoa-butter"] },
      stretch: { label: "স্ট্রেচ মার্ক", slugs: ["palmer-s-stretch-marks-cream", "pax-moly-mom-s-care", "dr-james-stretch-mark-cream"] },
    },
  },
  cold: {
    label: "সর্দি-কাশি",
    desc: "নাক বন্ধ, গলা ব্যথা, কাশি",
    subs: {
      nose: { label: "নাক বন্ধ বা সর্দি", slugs: ["vicks-vaporub", "poy-sian-inhaler", "green-seven-aroma-inhaler", "tiger-balm-white-ointment"], childSlugs: ["vicks-baby-rub"] },
      throat: { label: "গলা ব্যথা বা খুসখুসে ভাব", slugs: ["strepsils-lozenges"] },
      cough: { label: "কাশি", slugs: ["dabur-honitus-herbal-syrup", "vicks-vaporub"], childSlugs: ["vicks-baby-rub"] },
    },
  },
  hair: {
    label: "চুলের সমস্যা",
    desc: "খুশকি, উকুন, চুল পড়া",
    subs: {
      dandruff: { label: "খুশকি", slugs: ["nizoral-anti-dandruff-shampoo"] },
      lice: { label: "উকুন", slugs: ["mediker-anti-lice-shampoo", "mediker-natural-anti-lice-oil"] },
      fall: { label: "চুল পড়া বা মাথা গরম", slugs: ["indulekha-bringha-hair-oil", "navratna-cool-oil"] },
    },
  },
  foot: {
    label: "পা ফাটা",
    desc: "গোড়ালি ফাটা, শক্ত চামড়া",
    subs: {
      crack: { label: "গোড়ালি ফাটা", slugs: ["dr-rhazes-foot-cream", "krack-heel-repair-cream", "bio-active-foot-cream"] },
      hard: { label: "শক্ত, খসখসে চামড়া", slugs: ["herbal-heel-balm", "dr-rhazes-foot-cream", "bio-active-foot-cream"] },
    },
  },
  oral: {
    label: "দাঁত ও মুখ",
    desc: "মুখে গন্ধ, দাঁতের দাগ",
    subs: {
      smell: { label: "মুখে দুর্গন্ধ", slugs: ["fresh-breath-mouth-spray", "rivaj-uk-sweet-breath-spray", "charcoal-toothpaste"] },
      stain: { label: "দাঁতের দাগ বা প্লাক", slugs: ["charcoal-toothpaste", "oral-b-superfloss", "oral-b-essential-floss"] },
      kids: { label: "বাচ্চার দাঁতের যত্ন", slugs: ["kodomo-kids-toothpaste", "kodomo-kids-mouthwash"] },
    },
  },
  baby: {
    label: "শিশুর যত্ন",
    desc: "পেটে অস্বস্তি, ম্যাসাজ, মশা",
    subs: {
      colic: { label: "পেটে গ্যাস বা অস্বস্তি", slugs: ["woodward-s-gripe-water"] },
      massage: { label: "বেবি ম্যাসাজ", slugs: ["dabur-lal-tail"] },
      mosq: { label: "মশা থেকে সুরক্ষা", slugs: ["odomos-mosquito-cream"] },
    },
  },
};

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

export interface KitMatch {
  slug: string;
  itemSlugs: string[];
  match: string[]; // QUIZ sub-keys this kit is recommended for, e.g. "skin:ring"
}

export const KIT_MATCHES: KitMatch[] = [
  { slug: "ringworm-itching-kit", itemSlugs: ["skineal-cream", "clotrimazole-dusting-powder", "asepso-sport-antibacterial-soap"], match: ["skin:ring", "skin:heat"] },
  { slug: "neck-back-pain-kit", itemSlugs: ["volini-gel", "advanced-back-pain-roll-on", "original-zandu-balm"], match: ["pain:back", "pain:joint"] },
  { slug: "cold-cough-relief-kit", itemSlugs: ["vicks-vaporub", "strepsils-lozenges", "poy-sian-inhaler"], match: ["cold:nose", "cold:throat", "cold:cough"] },
  { slug: "cracked-heel-repair-kit", itemSlugs: ["krack-heel-repair-cream", "vaseline-cocoa-butter"], match: ["foot:crack", "foot:hard"] },
  { slug: "lice-removal-kit", itemSlugs: ["mediker-anti-lice-shampoo", "mediker-natural-anti-lice-oil"], match: ["hair:lice"] },
];
