"use client";

import Link from "next/link";

import { CASE_STUDIES } from "@/config/case-studies";

const FEATURED_CASE_STUDIES = CASE_STUDIES.slice(0, 3);

export const WORK_CASE_STUDY_COUNT = FEATURED_CASE_STUDIES.length;

export function CaseStudyCards() {
  return (
    <div className="work-case-study-list" role="list">
      {FEATURED_CASE_STUDIES.map((caseStudy) => (
        <Link
          key={caseStudy.slug}
          className="work-case-study-card"
          href={`/work/${caseStudy.slug}`}
          role="listitem"
        >
          <dl className="work-case-study-card__meta">
            <div className="work-case-study-card__meta-item">
              <dt className="text-label-1 text-text-primary">TIMELINE</dt>
              <dd className="text-body-1 text-text-muted">{caseStudy.timeline}</dd>
            </div>
            <div className="work-case-study-card__meta-item">
              <dt className="text-label-1 text-text-primary">ROLE</dt>
              <dd className="text-body-1 text-text-muted">{caseStudy.role}</dd>
            </div>
            <div className="work-case-study-card__meta-item">
              <dt className="text-label-1 text-text-primary">TEAM</dt>
              <dd className="text-body-1 text-text-muted">{caseStudy.team}</dd>
            </div>
          </dl>
          <article className="work-case-study-card__feature">
            <h2 className="work-case-study-card__title text-display-3 text-text-primary">
              {caseStudy.cardTitle ?? caseStudy.title}
            </h2>
            {caseStudy.heroVideo ? (
              <video
                aria-label={`${caseStudy.title} hero visual`}
                autoPlay
                className="work-case-study-card__video"
                loop
                muted
                playsInline
                poster={caseStudy.heroPoster || undefined}
                preload="metadata"
              >
                <source src={caseStudy.heroVideo} type="video/mp4" />
              </video>
            ) : (
              <div
                aria-label={`${caseStudy.title} hero visual placeholder`}
                className="work-case-study-card__placeholder"
                role="img"
              />
            )}
          </article>
        </Link>
      ))}
    </div>
  );
}
