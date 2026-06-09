declare module "*.mdx" {
  import type { CaseStudyFrontmatter } from "@/config/case-studies";

  export const frontmatter: CaseStudyFrontmatter;
}
