import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "puddingsworld",
    template: "%s · puddingsworld",
  },
  description:
    "Software, research, and the messy in-between. Personal site of GeniusPudding.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg-base text-ink-primary antialiased">
        <Nav />
        {children}
      </body>
    </html>
  );
}
