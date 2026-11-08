import Link from "next/link";
import { STORE_ADDRESS, STORE_HOURS, STORE_NAME, WHATSAPP_NUMBER } from "@/lib/store";
import { bn } from "@/lib/bn-digits";

export function Footer() {
  return (
    <footer className="mt-5 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 text-sm sm:grid-cols-3 xl:px-8">
        <div className="flex flex-col gap-2">
          <b className="font-display text-amber font-bold text-xl ">{STORE_NAME}</b>
          <p className="text-muted">
            ব্যথা, চুলকানি, সর্দি, ত্বক ও পরিবারের যত্নের আসল পণ্য এক জায়গায়। পণ্য হাতে পেয়ে টাকা দিন, সারা
            বাংলাদেশে হোম ডেলিভারি।
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <b className="font-display text-xl text-amber font-bold ">যোগাযোগ</b>
          {WHATSAPP_NUMBER && <span className="num text-muted">কল/হোয়াটসঅ্যাপ: +{WHATSAPP_NUMBER}</span>}
          <span className="text-muted">{STORE_HOURS}</span>
          <span className="text-muted">{STORE_ADDRESS}</span>
        </div>

        <div className="flex flex-col gap-2">
          <b className="font-display text-xl text-amber font-bold ">তথ্য</b>
          <Link href="/track" className="text-muted hover:text-leaf-deep">
            অর্ডার ট্র্যাক করুন
          </Link>
          <Link href="/policy" className="text-muted hover:text-leaf-deep">
            ডেলিভারি ও রিটার্ন নীতি
          </Link>
          <Link href="/quiz" className="text-muted hover:text-leaf-deep">
            কোন পণ্য নেবেন? কুইজ
          </Link>
          <Link href="/#health-tips" className="text-muted hover:text-leaf-deep">
            স্বাস্থ্য টিপস
          </Link>
        </div>
      </div>
      <div className="border-t border-line px-4 py-4 text-center text-xs text-muted xl:px-8">
        © {bn(new Date().getFullYear())} {STORE_NAME}
      </div>
    </footer>
  );
}
