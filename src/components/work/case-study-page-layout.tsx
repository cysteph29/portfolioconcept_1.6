"use client";

import Image from "next/image";
import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";

import { CaseStudyOpeningGallery } from "@/components/work/case-study-opening-gallery";
import { CaseStudyToc } from "@/components/work/case-study-toc";
import { TrailheadProductOpening } from "@/components/work/trailhead-product-opening";
import { getCaseStudyBySlug } from "@/config/case-studies";

type CaseStudyHeroSummaryItemProps = {
  emblem?: string;
  label: string;
  summary: string;
};

const DEFAULT_PROBLEM_EMBLEM = "/assets/problem-mosaic.png";
const DEFAULT_SOLUTION_EMBLEM = "/assets/solution-mosaic.png";
const DEFAULT_OUTCOME_EMBLEM = "/assets/outcome-mosaic.png";

function CaseStudyHeroSummaryItem({ emblem, label, summary }: CaseStudyHeroSummaryItemProps) {
  return (
    <div className="case-study-hero__summary-item">
      <div className="case-study-hero__summary-heading">
        <p className="case-study-hero__summary-label text-heading-3">{label}</p>
        <div aria-hidden="true" className="case-study-hero__summary-emblem">
          {emblem ? (
            <Image
              alt=""
              className="case-study-hero__summary-emblem-image"
              fill
              sizes="2.5rem"
              src={emblem}
            />
          ) : null}
        </div>
      </div>
      <p className="case-study-hero__summary-text text-body-1">{summary}</p>
    </div>
  );
}

export function CaseStudyPageLayout({
  children,
  slug,
}: {
  children?: ReactNode;
  slug: string;
}) {
  const caseStudy = getCaseStudyBySlug(slug);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("case-study-section--revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.04 },
    );

    const observeSections = () => {
      const sections = container.querySelectorAll<HTMLElement>(".case-study-section");
      const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      sections.forEach((section) => {
        if (section.classList.contains("case-study-section--revealed")) return;

        if (shouldReduceMotion) {
          section.classList.add("case-study-section--revealed");
          return;
        }

        observer.observe(section);
      });
    };

    observeSections();

    // MDX content can change in place during Fast Refresh. Observe added
    // sections so they receive the reveal class without changing hook inputs.
    const mutationObserver = new MutationObserver(observeSections);
    mutationObserver.observe(container, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, []);

  if (!caseStudy) {
    return null;
  }

  const productGallery = Boolean(caseStudy.productGallery);
  const customOpening =
    !productGallery && caseStudy.openingGallery && caseStudy.openingGallery.length >= 3
      ? caseStudy.openingGallery
      : null;
  const singleVideoOpening = !productGallery && !customOpening && Boolean(caseStudy.heroVideo);
  const visibleTitle = caseStudy.cardTitle ?? caseStudy.title;

  const summaryPatternStyle = caseStudy.summaryPattern
    ? ({
        backgroundImage: `url("${caseStudy.summaryPattern}")`,
        backgroundPosition: "top left",
        backgroundRepeat: "repeat",
        backgroundSize: "85px 612px",
      } satisfies CSSProperties)
    : undefined;

  return (
    <section className="fold-panel case-study-fold">
      {productGallery ? (
        <TrailheadProductOpening />
      ) : singleVideoOpening ? (
        <header className="case-study-opening" data-smart-navbar-hero>
          <div className="case-study-opening__frame">
            <video
              aria-label={`${visibleTitle} media`}
              autoPlay
              className="case-study-opening-video"
              height={1080}
              loop
              muted
              playsInline
              poster={caseStudy.heroPoster || undefined}
              width={1920}
            >
              <source src={caseStudy.heroVideo} />
            </video>
          </div>
        </header>
      ) : (
        <header
          className={[
            "case-study-hero",
            customOpening ? "case-study-hero--opening-gallery" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          data-smart-navbar-hero
        >
        {customOpening ? (
          <CaseStudyOpeningGallery
            panels={customOpening}
            poster={caseStudy.heroPoster}
            title={caseStudy.title}
            videoSrc={caseStudy.heroVideo}
          />
        ) : (
          <div className="case-study-hero__inner">
            <h1 className="case-study-hero__title text-heading-1">{caseStudy.title}</h1>
            <div className="case-study-hero__summary-stack">
              {caseStudy.summaryPattern ? (
                <div
                  aria-hidden="true"
                  className="case-study-hero__summary-pattern"
                  style={summaryPatternStyle}
                />
              ) : null}
              <CaseStudyHeroSummaryItem
                emblem={caseStudy.problemEmblem || DEFAULT_PROBLEM_EMBLEM}
                label="Problem"
                summary={caseStudy.problem}
              />
              <CaseStudyHeroSummaryItem
                emblem={caseStudy.solutionEmblem || DEFAULT_SOLUTION_EMBLEM}
                label="Solution"
                summary={caseStudy.solution}
              />
              <CaseStudyHeroSummaryItem
                emblem={caseStudy.outcomeEmblem || DEFAULT_OUTCOME_EMBLEM}
                label="Outcome"
                summary={caseStudy.outcome}
              />
            </div>

            <div
              className="case-study-hero__media-panel"
              aria-label={`${caseStudy.title} media`}
              style={summaryPatternStyle}
            >
              {caseStudy.heroVideo ? (
                <video
                  autoPlay
                  className="case-study-hero__video"
                  loop
                  muted
                  playsInline
                  poster={caseStudy.heroPoster || undefined}
                >
                  <source src={caseStudy.heroVideo} />
                </video>
              ) : null}
            </div>
          </div>
        )}
        </header>
      )}

      <div
        className={[
          "case-study-layout",
          customOpening ? "case-study-layout--wide-media" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="case-study-layout__inner">
          <aside className="case-study-layout__left" aria-label="Case study navigation">
            <div className="case-study-sidebar">
              <CaseStudyToc sections={caseStudy.sections} />
            </div>
          </aside>
          <article
            className={[
              "case-study-layout__content",
              slug === "salesforce-trailhead-preview"
                ? "case-study-layout__content--trailhead-preview"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            ref={contentRef}
          >
            {customOpening || singleVideoOpening ? (
              <div className="case-study-article-heading">
                <h1 className="case-study-article-title text-heading-1">{visibleTitle}</h1>
                <hr className="case-study-article-title__rule" />
              </div>
            ) : null}
            {children}
          </article>
        </div>
      </div>
      {caseStudy.liveUrl ? (
        <a
          className="case-study-live-cta text-heading-5"
          href={caseStudy.liveUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Visit Website ↗
        </a>
      ) : null}
    </section>
  );
}
