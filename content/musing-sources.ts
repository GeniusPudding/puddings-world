import type { MusingSource } from "@/lib/gdocs-fetch";

// Google Docs (or Drive folders of Docs) that /musings reads live. Each must
// be shared as "Anyone with the link: Viewer". Editing the doc updates the
// site within DOC_REVALIDATE_SEC; every doc dropped into a listed folder is
// published, so only list folders meant to be public.
//
// kind: "lyrics" (a heading or `---` starts each song), "sayings" (one per
// paragraph or list item), or "auto". Try links first on /musings/lab.

const doc = (id: string) => `https://docs.google.com/document/d/${id}/edit`;

export const musingSources: MusingSource[] = [
  { url: doc("1-XzbpFeCzs1hdGGlih40Cl31e-iMwYf6P0CwFTjGPS0"), kind: "lyrics", label: "手沖咖啡" },
  { url: doc("1e69HVnHu4c5FuM6ZHgs597VVO5azVoMHHcQ9oaGNUzg"), kind: "lyrics", label: "牙套" },
  { url: doc("1pLtpXnGWdgm6C0StHTbj9afxKfO14RkQZIMH6S6HY2o"), kind: "lyrics", label: "來不及，寫歌" },
  { url: doc("1whzj8meDgO4DK52OKfY5K_s9b6bBYwBo"), kind: "lyrics", label: "佛道" },
  { url: doc("1xDNFmTv-o058cVqwMJFrVyCVWc7fcCeYmoeYZ9hiMeU"), kind: "lyrics", label: "六十年前的畫" },
  { url: doc("12HrfwiN5wLsYYjPajfWtZREPiT9B9-gSJ79qJWtfMQk"), kind: "sayings", label: "點心，語錄" },
];
