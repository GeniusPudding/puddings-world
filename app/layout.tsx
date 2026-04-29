import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "puddingsworld",
  description: "A live dashboard of R&D projects in flight.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg-base text-ink-primary antialiased">
        {children}
      </body>
    </html>
  );
}
