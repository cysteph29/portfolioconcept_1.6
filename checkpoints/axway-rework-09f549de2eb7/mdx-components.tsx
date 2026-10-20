import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";

import { AxwayFindWorkaround } from "@/components/work/axway-find-workaround";
import { CaseFigure } from "@/components/work/case-figure";
import { CaseMetrics, CasePercentageCards } from "@/components/work/case-metrics";
import { CaseVideo } from "@/components/work/case-video";
import type { CaseStudySection } from "@/config/case-studies";

type SectionProps = {
  children: ReactNode;
  id: string;
  sections: CaseStudySection[];
  divided?: boolean;
};

function Section({ children, id, sections, divided = false }: SectionProps) {
  const section = sections.find((candidate) => candidate.id === id);

  if (!section) {
    throw new Error(`Missing case study section metadata for "${id}".`);
  }

  return (
    <section
      className={divided ? "case-study-section case-study-section--divided" : "case-study-section"}
      id={id}
    >
      <p className="case-study-section__eyebrow text-heading-5 text-text-muted">
        {section.label}
      </p>
      <div className="case-study-section__body">{children}</div>
    </section>
  );
}

type ImagePlaceholderProps = {
  label: string;
  ratio?: string;
};

function ImagePlaceholder({ label, ratio = "16/9" }: ImagePlaceholderProps) {
  return (
    <div
      className="relative flex items-center justify-center bg-fold-fill"
      style={{
        aspectRatio: ratio,
        borderWidth: "var(--border-width-hairline)",
        borderStyle: "solid",
        borderColor: "var(--color-text-muted)",
      }}
    >
      <span className="max-w-[36rem] px-6 text-center text-body-2 text-text-muted">
        {label}
      </span>
    </div>
  );
}

const components: MDXComponents = {
  Section,
  ImagePlaceholder,
  AxwayFindWorkaround,
  CaseFigure,
  CaseMetrics,
  CasePercentageCards,
  CaseVideo,
  h1: (props) => <h1 className="font-pixel text-headline text-text-primary" {...props} />,
  h2: (props) => <h2 className="text-heading-4 text-text-primary" {...props} />,
  h3: (props) => <h3 className="font-pixel text-button text-text-primary" {...props} />,
  p: (props) => <p className="text-body-1 text-text-muted" {...props} />,
  ul: (props) => <ul className="list-disc space-y-2 pl-5 text-text-muted" {...props} />,
  li: (props) => <li className="text-body-1" {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
