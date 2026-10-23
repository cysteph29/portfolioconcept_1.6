import type { MetadataRoute } from "next";

// Only published portfolio pages; review copies, drafts and demos are excluded.
const publicPaths = [
  "/",
  "/about",
  "/playground",
  "/work/salesforce-trailhead",
  "/work/axway",
  "/work/the-ken",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.map((path) => ({
    url: `https://www.cyrilstephen.com${path}`,
  }));
}
