import { Spinner } from "@/components/spinner";

// Next.js's own route-level fallback — shown inside <main> (header/footer
// stay put) the moment a navigation lands on a page that's still fetching
// from the backend, for every route that doesn't already define its own
// more specific loading.tsx. Previously nothing showed at all during that
// wait, so slower fetches looked like a stuck/blank page.
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="h-10 w-10" />
    </div>
  );
}
