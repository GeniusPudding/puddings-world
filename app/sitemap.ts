import type { MetadataRoute } from "next";
import { tracks } from "@/content/projects";

const SITE_URL = "https://puddings-world.com";

const STATIC_ROUTES = [
  "",
  "/about",
  "/interests",
  "/projects",
  "/services",
  "/playground",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const projectRoutes = tracks
    .flatMap((t) => t.projects)
    .map((p) => `/projects/${p.slug}`);

  return [...STATIC_ROUTES, ...projectRoutes].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path.startsWith("/projects/") ? "weekly" : "monthly",
    priority: path === "" ? 1.0 : path.startsWith("/projects") ? 0.8 : 0.6,
  }));
}
