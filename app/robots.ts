import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://puddings-world.com/sitemap.xml",
    host: "https://puddings-world.com",
  };
}
