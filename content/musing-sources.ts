import type { MusingSource } from "@/lib/gdocs-fetch";

// Google Docs (or Drive folders of Docs) that /musings reads live. Each must
// be shared as "Anyone with the link: Viewer". Editing the doc updates the
// site within DOC_REVALIDATE_SEC; every doc dropped into a listed folder is
// published, so only list folders meant to be public.
//
// kind: "lyrics" (a heading or `---` starts each song), "sayings" (one per
// paragraph or list item), or "auto". Try links first on /musings/lab.

export const musingSources: MusingSource[] = [];
