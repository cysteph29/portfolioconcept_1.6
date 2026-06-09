"use client";

import { TransitionLink } from "@/components/navigation/transition-link";
import { CASE_STUDIES } from "@/config/case-studies";

export function CaseStudyCards() {
  return (
    <div className="work-case-study-list">
      {CASE_STUDIES.map((caseStudy) => (
        <TransitionLink
          key={caseStudy.slug}
          axis="y"
          className="work-case-study-card"
          direction={1}
          href={`/work/${caseStudy.slug}`}
          scroll
        >
          <div
            aria-label={`${caseStudy.title} cover placeholder`}
            className="work-case-study-card__cover"
            data-cover={caseStudy.cover}
            role="img"
          />
          <div className="work-case-study-card__body">
            <h2 className="work-case-study-card__title font-pixel text-headline text-text-primary">
              {caseStudy.cardTitle ?? caseStudy.title}
            </h2>
            <p className="work-case-study-card__description font-sans text-subhead text-text-muted">
              {caseStudy.description}
            </p>
            <dl className="work-case-study-card__meta font-sans text-button text-text-muted">
              <div className="work-case-study-card__meta-item">
                <dt>TIMELINE</dt>
                <dd>{caseStudy.timeline}</dd>
              </div>
              <div className="work-case-study-card__meta-item">
                <dt>ROLE</dt>
                <dd>{caseStudy.role}</dd>
              </div>
            </dl>
          </div>
        </TransitionLink>
      ))}
    </div>
  );
}
