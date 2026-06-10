import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";

import { CaseFigure } from "@/components/work/case-figure";
import type { CaseStudySection } from "@/config/case-studies";

type SectionProps = {
  children: ReactNode;
  id: string;
  sections: CaseStudySection[];
};

function Section({ children, id, sections }: SectionProps) {
  const section = sections.find((candidate) => candidate.id === id);

  if (!section) {
    throw new Error(`Missing case study section metadata for "${id}".`);
  }

  return (
    <section className="case-study-section" id={id}>
      <p className="case-study-section__eyebrow font-pixel text-button text-text-muted">
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
      <span className="font-pixel text-button text-text-muted text-center px-4">
        {label}
      </span>
    </div>
  );
}

const components: MDXComponents = {
  Section,
  ImagePlaceholder,
  CaseFigure,
  h1: (props) => <h1 className="font-pixel text-headline text-text-primary" {...props} />,
  h2: (props) => <h2 className="font-pixel text-subhead text-text-primary" {...props} />,
  h3: (props) => <h3 className="font-pixel text-button text-text-primary" {...props} />,
  p: (props) => <p className="font-sans text-subhead text-text-muted" {...props} />,
  ul: (props) => <ul className="list-disc space-y-2 pl-5 text-text-muted" {...props} />,
  li: (props) => <li className="leading-7" {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
