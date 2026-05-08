import { unstable_cache } from "next/cache";
import { loadCatalog } from "@/lib/ktv/catalog";
import { KtvMenu } from "./_components/KtvMenu";

export const metadata = {
  title: "Street KTV — request a song · puddingsworld",
  description:
    "Live song queue for street KTV gigs. Scan, pick a song, and the performer will sing it.",
};

// Catalog lives in Vercel KV (written by the performer app). Cache the
// rendered server component for 30 s so we don't re-hit Redis on every
// request, and tag it so a PUT to /api/ktv/catalog can `revalidateTag` to
// publish a new songbook within the second.
const getCachedCatalog = unstable_cache(loadCatalog, ["ktv-catalog"], {
  revalidate: 30,
  tags: ["ktv-catalog"],
});

export default async function StreetKtvMenuPage() {
  const catalog = await getCachedCatalog();
  return <KtvMenu catalog={catalog} />;
}
