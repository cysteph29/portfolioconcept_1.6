import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-frontmatter", "remark-mdx-frontmatter"],
  },
});

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  pageExtensions: ["ts", "tsx", "md", "mdx"],
};

export default withMDX(nextConfig);
