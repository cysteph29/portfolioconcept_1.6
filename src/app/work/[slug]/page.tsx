import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ComponentType } from "react";

import { CaseStudyPageLayout } from "@/components/work/case-study-page-layout";
import Axway from "@/content/case-studies/axway.mdx";
import AxwayPreview from "@/content/case-studies/axway-preview.mdx";
import TheKen from "@/content/case-studies/the-ken.mdx";
import SalesforceTrailhead from "@/content/case-studies/salesforce-trailhead.mdx";
import SalesforceTrailheadPreview from "@/content/case-studies/salesforce-trailhead-preview.mdx";
import DummyCaseStudyThree from "@/content/case-studies/dummy-case-study-3.mdx";
import {
  CASE_STUDIES,
  UNLISTED_CASE_STUDIES,
  getCaseStudyBySlug,
  isUnlistedCaseStudy,
} from "@/config/case-studies";

const CASE_STUDY_CONTENT_BY_SLUG: Record<string, ComponentType> = {
  "axway": Axway,
  "axway-preview": AxwayPreview,
  "the-ken": TheKen,
  "salesforce-trailhead": SalesforceTrailhead,
  "salesforce-trailhead-preview": SalesforceTrailheadPreview,
  "dummy-case-study-3": DummyCaseStudyThree,
};

export const dynamicParams = false;

export function generateStaticParams() {
  return [...CASE_STUDIES, ...UNLISTED_CASE_STUDIES].map((caseStudy) => ({
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

  const searchMetadata: Record<string, { title: string; description: string }> = {
    "salesforce-trailhead": {
      title: "Salesforce Trailhead — AI UX Case Study · Cyril Stephen",
      description: "How Cyril Stephen designed an AI-powered learning experience for Salesforce Trailhead, combining user research, interaction design, and coded prototypes.",
    },
    axway: {
      title: "Axway E-Invoicing — UX Case Study · Cyril Stephen",
      description: "How Cyril Stephen redesigned error finding and troubleshooting in Axway E-Invoicing to reduce failed-invoice resolution time by 67%.",
    },
    "the-ken": {
      title: "The Ken — Checkout Redesign · Cyril Stephen",
      description: "How Cyril Stephen redesigned The Ken's subscription checkout to reduce friction and increase conversion by 5.6 percentage points.",
    },
  };

  return {
    title: searchMetadata[slug]?.title ?? `${caseStudy.title} Case Study`,
    description: searchMetadata[slug]?.description ?? caseStudy.description,
    ...(isUnlistedCaseStudy(slug)
      ? { robots: { index: false, follow: false } }
      : {}),
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
    <CaseStudyPageLayout slug={slug}>
      <CaseStudyContent />
    </CaseStudyPageLayout>
  );
}
