export default function PolicyPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 rounded-card bg-surface p-6 sm:p-8">
      <h1 className="font-display text-2xl">ডেলিভারি ও রিটার্ন নীতি</h1>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg text-leaf-deep">ডেলিভারি</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          <li>সারা বাংলাদেশে হোম ডেলিভারি।</li>
          <li>ক্যাশ অন ডেলিভারি — পণ্য হাতে পেয়ে টাকা দিন।</li>
          <li>পণ্য হাতে পাওয়ার সাথে সাথেই প্যাকেট যাচাই করে নিন।</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg text-leaf-deep">রিটার্ন ও বদল</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          <li>ভাঙা বা ভুল পণ্য পেলে দ্রুত আমাদের জানান — আমরা বদলে দেব।</li>
          <li>সিল করা প্যাকেট খোলা বা ব্যবহৃত পণ্যের ক্ষেত্রে বদল প্রযোজ্য নয়।</li>
        </ul>
      </section>

      <p className="text-sm text-muted">
        কোনো প্রশ্ন থাকলে হোয়াটসঅ্যাপে বা কাস্টমার কেয়ার নম্বরে যোগাযোগ করুন।
      </p>
    </div>
  );
}
