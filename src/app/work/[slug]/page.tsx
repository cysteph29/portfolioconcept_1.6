import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ComponentType } from "react";

import { CaseStudyFold } from "@/components/folds/route-folds";
import Axway from "@/content/case-studies/axway.mdx";
import TheKen from "@/content/case-studies/the-ken.mdx";
import SalesforceTrailhead from "@/content/case-studies/salesforce-trailhead.mdx";
import DummyCaseStudyThree from "@/content/case-studies/dummy-case-study-3.mdx";
import { CASE_STUDIES, getCaseStudyBySlug } from "@/config/case-studies";

const CASE_STUDY_CONTENT_BY_SLUG: Record<string, ComponentType> = {
  "axway": Axway,
  "the-ken": TheKen,
  "salesforce-trailhead": SalesforceTrailhead,
  "dummy-case-study-3": DummyCaseStudyThree,
};

export const dynamicParams = false;

export function generateStaticParams() {
  return CASE_STUDIES.map((caseStudy) => ({
    slug: caseStudy.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);

  if (!caseStudy) {
    return {};
  }

  return {
    title: `${caseStudy.title} Case Study`,
    description: caseStudy.description,
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);
  const CaseStudyContent = CASE_STUDY_CONTENT_BY_SLUG[slug];

  if (!caseStudy || !CaseStudyContent) {
    notFound();
  }

  return (
    <CaseStudyFold slug={slug}>
      <CaseStudyContent />
    </CaseStudyFold>
  );
}
