import { catalog } from "@/content/ktv-catalog";
import { KtvMenu } from "./_components/KtvMenu";

export const metadata = {
  title: "Street KTV — request a song · puddingsworld",
  description:
    "Live song queue for street KTV gigs. Scan, pick a song, and the performer will sing it.",
};

export default function StreetKtvMenuPage() {
  return <KtvMenu catalog={catalog} />;
}
