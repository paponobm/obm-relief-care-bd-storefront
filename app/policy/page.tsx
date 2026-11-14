import { getPolicy } from "@/lib/store";

export const dynamic = "force-dynamic";

// Sections are admin-curated (Settings → Policy, multiple title+lines
// blocks) — getPolicy() always returns at least the two sections already
// live today (Delivery, Return & Exchange) even for a channel that's never
// touched that tab, so this page's own layout/copy otherwise stays the same.
export default async function PolicyPage() {
  const sections = await getPolicy().catch(() => []);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 rounded-card bg-surface p-6 sm:p-8">
      <h1 className="font-display text-2xl">ডেলিভারি ও রিটার্ন নীতি</h1>

      {sections.map((section, i) => (
        <section key={i} className="flex flex-col gap-2">
          <h2 className="font-display text-lg text-leaf-deep">{section.title}</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {section.points.map((point, j) => (
              <li key={j}>{point}</li>
            ))}
          </ul>
        </section>
      ))}

      <p className="text-sm text-muted">
        কোনো প্রশ্ন থাকলে হোয়াটসঅ্যাপে বা কাস্টমার কেয়ার নম্বরে যোগাযোগ করুন।
      </p>
    </div>
  );
}
