import type { MetadataRoute } from "next";
import { loadProjects } from "@/lib/projects";
import { musings } from "@/content/musings";

const SITE_URL = "https://puddings-world.com";

const STATIC_ROUTES = [
  "",
  "/about",
  "/interests",
  "/musings",
  "/projects",
  "/services",
  "/services/toefl-trainer",
  "/playground",
  "/contact",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const { projects } = await loadProjects();
  const projectRoutes = projects.map((p) => `/projects/${p.slug}`);

  const musingRoutes = musings.map((m) => `/musings/${m.slug}`);

  return [...STATIC_ROUTES, ...projectRoutes, ...musingRoutes].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path.startsWith("/projects/") ? "weekly" : "monthly",
    priority:
      path === ""
        ? 1.0
        : path.startsWith("/projects") || path.startsWith("/musings")
          ? 0.8
          : 0.6,
  }));
}
