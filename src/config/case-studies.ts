import { frontmatter as axway } from "@/content/case-studies/axway.mdx";
import { frontmatter as theKen } from "@/content/case-studies/the-ken.mdx";
import { frontmatter as salesforceTrailhead } from "@/content/case-studies/salesforce-trailhead.mdx";
import { frontmatter as dummyCaseStudyThree } from "@/content/case-studies/dummy-case-study-3.mdx";

export type CaseStudySection = {
  id: string;
  label: string;
};

export type CaseStudyFrontmatter = {
  cover: string;
  slug: string;
  title: string;
  cardTitle?: string;
  description: string;
  problem: string;
  problemEmblem?: string;
  solution: string;
  solutionEmblem?: string;
  outcome: string;
  outcomeEmblem?: string;
  liveUrl?: string;
  heroMosaic: string;
  summaryPattern?: string;
  heroVideo?: string;
  heroPoster?: string;
  timeline: string;
  role: string;
  team: string;
  sections: CaseStudySection[];
};

export type CaseStudy = Omit<CaseStudyFrontmatter, "summaryPattern"> & {
  summaryPattern: string;
};

const DEFAULT_SUMMARY_PATTERN = "/assets/summary-pattern.svg";

function defineCaseStudy(frontmatter: CaseStudyFrontmatter): CaseStudy {
  return {
    ...frontmatter,
    summaryPattern: frontmatter.summaryPattern ?? DEFAULT_SUMMARY_PATTERN,
  };
}

export const CASE_STUDIES: CaseStudy[] = [
  defineCaseStudy(axway),
  defineCaseStudy(theKen),
  defineCaseStudy(salesforceTrailhead),
  defineCaseStudy(dummyCaseStudyThree),
];

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((caseStudy) => caseStudy.slug === slug);
}
