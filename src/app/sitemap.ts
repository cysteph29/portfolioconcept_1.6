import type { MetadataRoute } from "next";

// Only published portfolio pages; review copies, drafts and demos are excluded.
const publicPaths = [
  "/",
  "/about",
  "/playground",
  "/work/axway",
  "/work/salesforce-trailhead",
  "/work/the-ken",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.map((path) => ({
    url: `https://www.cyrilstephen.com${path}`,
  }));
}
