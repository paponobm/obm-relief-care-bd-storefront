// Two promo cards shown right after Flash Deal — "take the quiz" and
// "request a call". Deliberately inert for now (no href/onClick): the user
// asked for the section to go in first, with the actual button behavior to
// be wired up in a later pass once they say what each should do.
export function HelpCards() {
  return (
    <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex items-center gap-3 rounded-[20px] border-[1.5px] border-leaf bg-leaf-soft p-[18px]">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-leaf text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7" />
            <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
          </svg>
        </span>
        <span className="flex-1">
          <b className="font-display block text-xl text-leaf-deep">কোনটা নেবেন বুঝছেন না?</b>
          <span className="block text-sm text-muted">৩টা প্রশ্নের উত্তর দিন, আমরা ঠিক পণ্যটা খুঁজে দেব</span>
        </span>
        <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-leaf-deep">শুরু করুন →</span>
      </div>

      <div className="flex items-center gap-3 rounded-[20px] border-[1.5px] border-amber bg-amber-soft p-[18px]">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
          </svg>
        </span>
        <span className="flex-1">
          <b className="font-display block text-xl text-amber-deep">ফ্রি কল-পরামরশ নিন</b>
          <span className="block text-sm text-muted">সমস্যা লিখুন, আমাদের অভিজ্ঞ প্রতিনিধি কল করে সঠিক পণ্য বলে দেবেন</span>
        </span>
        <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-amber-deep">কল চাই →</span>
      </div>
    </section>
  );
}
