import { WHATSAPP_NUMBER } from "@/lib/store";

export function WhatsappWidget() {
  if (!WHATSAPP_NUMBER) return null;
  const href = `https://wa.me/${WHATSAPP_NUMBER}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="হোয়াটসঅ্যাপে কথা বলুন"
      className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#1FA855] text-white shadow-lg"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 20l1.3-3.8A8 8 0 1 1 8 19z" />
      </svg>
    </a>
  );
}
