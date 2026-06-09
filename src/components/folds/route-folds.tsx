"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

import { FoldWrapper } from "@/components/folds/fold-wrapper";
import { TwoColumnFoldShell } from "@/components/folds/two-column-fold-shell";
import { TransitionLink } from "@/components/navigation/transition-link";
import { useTransitionContext } from "@/components/navigation/transition-context";
import { SectionPlaceholder } from "@/components/sections/section-placeholder";
import { ExperienceCards } from "@/components/experience/experience-cards";
import { CaseStudyCards } from "@/components/work/case-study-cards";
import { CaseStudyToc } from "@/components/work/case-study-toc";
import { getCaseStudyBySlug } from "@/config/case-studies";
import { getSectionFromPathname } from "@/config/sections";

type RouteFoldOptions = {
  isTransitionOverlay?: boolean;
};

type CaseStudyHeroSummaryItemProps = {
  emblem?: string;
  label: string;
  summary: string;
};

const HIDE_HERO_CONTENT_FOR_AMBIENT_DEBUG = false;
const CASE_STUDY_HERO_AMBIENT_BAND_WIDTH = 240;
const CASE_STUDY_HERO_AMBIENT_VERTICAL_OFFSET_RATIO = 0.28;
const CASE_STUDY_HERO_AMBIENT_OPACITY = 0.085;
const CASE_STUDY_HERO_AMBIENT_CONVERGENCE_POINTS = [0.7, 0.9, 1.1] as const;

function CaseStudyHeroAmbient({
  heroRef,
  mosaic,
}: {
  heroRef: React.RefObject<HTMLElement | null>;
  mosaic?: string;
}) {
  const [heroSize, setHeroSize] = useState({ width: 0, height: 0 });
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const columnCount = Math.max(
    2,
    Math.floor(heroSize.width / CASE_STUDY_HERO_AMBIENT_BAND_WIDTH),
  );
  const verticalOffset = heroSize.height * CASE_STUDY_HERO_AMBIENT_VERTICAL_OFFSET_RATIO;
  const aboveColumnYFast = useTransform(
    scrollYProgress,
    [0, CASE_STUDY_HERO_AMBIENT_CONVERGENCE_POINTS[0]],
    [-verticalOffset, 0],
  );
  const aboveColumnYMedium = useTransform(
    scrollYProgress,
    [0, CASE_STUDY_HERO_AMBIENT_CONVERGENCE_POINTS[1]],
    [-verticalOffset, 0],
  );
  const aboveColumnYSlow = useTransform(
    scrollYProgress,
    [0, CASE_STUDY_HERO_AMBIENT_CONVERGENCE_POINTS[2]],
    [-verticalOffset, 0],
  );
  const belowColumnYFast = useTransform(
    scrollYProgress,
    [0, CASE_STUDY_HERO_AMBIENT_CONVERGENCE_POINTS[0]],
    [verticalOffset, 0],
  );
  const belowColumnYMedium = useTransform(
    scrollYProgress,
    [0, CASE_STUDY_HERO_AMBIENT_CONVERGENCE_POINTS[1]],
    [verticalOffset, 0],
  );
  const belowColumnYSlow = useTransform(
    scrollYProgress,
    [0, CASE_STUDY_HERO_AMBIENT_CONVERGENCE_POINTS[2]],
    [verticalOffset, 0],
  );
  const aboveColumnYs = [aboveColumnYFast, aboveColumnYMedium, aboveColumnYSlow];
  const belowColumnYs = [belowColumnYFast, belowColumnYMedium, belowColumnYSlow];

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const updateHeroSize = () => {
      const rect = hero.getBoundingClientRect();
      setHeroSize({ width: rect.width, height: rect.height });
    };

    updateHeroSize();

    const observer = new ResizeObserver(updateHeroSize);
    observer.observe(hero);

    return () => observer.disconnect();
  }, [heroRef]);

  if (!mosaic) {
    return null;
  }

  return (
    <div aria-hidden="true" className="case-study-hero__ambient">
      {Array.from({ length: columnCount }).map((_, index) => {
        const startsAboveCenter = index % 2 === 0;
        const restingY = startsAboveCenter ? -verticalOffset : verticalOffset;
        const convergenceIndex = index % CASE_STUDY_HERO_AMBIENT_CONVERGENCE_POINTS.length;
        const style = {
          "--case-study-ambient-x": `${((index + 0.5) / columnCount) * 100}%`,
          "--case-study-ambient-opacity": CASE_STUDY_HERO_AMBIENT_OPACITY,
          y: shouldReduceMotion
            ? restingY
            : startsAboveCenter
              ? aboveColumnYs[convergenceIndex]
              : belowColumnYs[convergenceIndex],
        } as React.CSSProperties;

        const fadeProps = shouldReduceMotion
          ? {}
          : {
              animate: { opacity: CASE_STUDY_HERO_AMBIENT_OPACITY },
              initial: { opacity: 0 },
              transition: {
                delay: index * 0.08,
                duration: 0.9,
                ease: "easeOut" as const,
              },
            };

        return (
          <motion.div
            className="case-study-hero__ambient-instance"
            key={`${mosaic}-column-${index}`}
            style={style}
          >
            <motion.div className="case-study-hero__ambient-fade" {...fadeProps}>
              <Image
                alt=""
                className="case-study-hero__ambient-image"
                height={113}
                sizes="150px"
                src={mosaic}
                width={150}
              />
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

function CaseStudyHeroSummaryItem({ emblem, label, summary }: CaseStudyHeroSummaryItemProps) {
  return (
    <div className="case-study-hero__summary-item">
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
      <div className="case-study-hero__summary-copy">
        <p className="case-study-hero__summary-label font-pixel">{label}</p>
        <p className="case-study-hero__summary-text font-sans text-subhead">{summary}</p>
      </div>
    </div>
  );
}

export function HomeFold() {
  return (
    <FoldWrapper className="home-fold">
      <div className="home-fold__center">
        <img
          alt="Portrait"
          className="home-fold__portrait"
          src="/assets/profilepic.png"
        />
        <h1 className="home-fold__headline font-pixel text-headline text-text-primary">
          I&apos;m A Product Designer Fascinated By People, And Leverage That To Build Products Worth
          Using.
        </h1>
        <p className="home-fold__subhead font-sans text-subhead text-text-muted">
          Previously owned design for an enterprise FinTech platform used by 100+ companies globally.
          I&apos;m currently open to Product/UX Design opportunities.
        </p>
      </div>

      <p className="home-fold__credibility font-sans text-credibility text-text-muted">
        I work fast, care about tiny details, and have an appetite for things I haven&apos;t tried
        before.
      </p>

      <div className="home-fold__actions">
        <TransitionLink
          axis="x"
          className="home-action home-action--secondary"
          direction={1}
          href="/about"
        >
          Who am I
        </TransitionLink>
        <TransitionLink
          axis="x"
          className="home-action home-action--primary"
          direction={1}
          href="/work"
        >
          <span>See work</span>
          <span aria-hidden="true">→</span>
        </TransitionLink>
      </div>
    </FoldWrapper>
  );
}

export function WorkFold() {
  return (
    <TwoColumnFoldShell
      className="work-fold"
      left={
        <div className="work-fold__identity">
          <div aria-hidden="true" className="work-fold__icon-placeholder" />
          <p className="work-fold__label font-pixel text-headline text-text-primary">Work</p>
        </div>
      }
    >
      <CaseStudyCards />
    </TwoColumnFoldShell>
  );
}

export function ExperienceFold({ isTransitionOverlay = false }: RouteFoldOptions = {}) {
  const pathname = usePathname();
  const { isTransitioning } = useTransitionContext();
  const isSettledExperience = pathname === "/experience" && !isTransitioning;
  const showSequencedEntrance = !isTransitionOverlay && isSettledExperience;
  const foldClassName = [
    "experience-fold",
    showSequencedEntrance || isTransitionOverlay ? "experience-fold--identity-visible" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <FoldWrapper className={foldClassName}>
      <div className="experience-fold__identity" aria-hidden="true">
        <div className="experience-fold__icon-placeholder" />
        <p className="experience-fold__label font-pixel text-headline text-text-primary">
          Experience
        </p>
      </div>
      <main className="experience-fold__scroll">
        <ExperienceCards isTransitionOverlay={isTransitionOverlay} />
      </main>
    </FoldWrapper>
  );
}

export function AboutFold() {
  return <SectionPlaceholder label="ABOUT" />;
}

export function ContactFold() {
  return (
    <SectionPlaceholder label="CONTACT">
      <p className="fold-placeholder__copy">
        Placeholder contact section route. Keeping this as a real URL makes every top-level
        destination directly shareable.
      </p>
      <div className="fold-placeholder__card">
        Dummy contact content goes here in the next phase.
      </div>
    </SectionPlaceholder>
  );
}

export function CaseStudyFold({ children, slug }: { children?: React.ReactNode; slug: string }) {
  const caseStudy = getCaseStudyBySlug(slug);
  const heroRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const sections = Array.from(
      container.querySelectorAll<HTMLElement>(".case-study-section"),
    );
    if (sections.length === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sections.forEach((s) => s.classList.add("case-study-section--revealed"));
      return;
    }

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

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  if (!caseStudy) {
    return null;
  }

  const summaryPatternStyle = caseStudy.summaryPattern
    ? ({ backgroundImage: `url("${caseStudy.summaryPattern}")` } satisfies React.CSSProperties)
    : undefined;

  return (
    <FoldWrapper className="case-study-fold">
      <header
        className={[
          "case-study-hero",
          HIDE_HERO_CONTENT_FOR_AMBIENT_DEBUG ? "case-study-hero--hide-content-debug" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        ref={heroRef}
      >
        <CaseStudyHeroAmbient heroRef={heroRef} mosaic={caseStudy.heroMosaic} />
        <div className="case-study-hero__inner">
          <div className="case-study-hero__intro">
            <h1 className="case-study-hero__title font-pixel text-headline">{caseStudy.title}</h1>
            <div className="case-study-hero__summary-stack">
              {caseStudy.summaryPattern ? (
                <div
                  aria-hidden="true"
                  className="case-study-hero__summary-pattern"
                  style={summaryPatternStyle}
                />
              ) : null}
              <CaseStudyHeroSummaryItem
                emblem={caseStudy.problemEmblem}
                label="Problem"
                summary={caseStudy.problem}
              />
              <CaseStudyHeroSummaryItem
                emblem={caseStudy.solutionEmblem}
                label="Solution"
                summary={caseStudy.solution}
              />
              <CaseStudyHeroSummaryItem
                emblem={caseStudy.outcomeEmblem}
                label="Outcome"
                summary={caseStudy.outcome}
              />
            </div>
          </div>

          <div className="case-study-hero__media-panel" aria-label={`${caseStudy.title} media`}>
            <div aria-hidden="true" className="case-study-hero__media-fill" />
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
      </header>

      <div className="case-study-layout">
        <div className="case-study-layout__inner">
          <aside className="case-study-layout__left" aria-label="Case study navigation">
            <div className="case-study-sidebar">
              <CaseStudyToc sections={caseStudy.sections} />
            </div>
          </aside>
          <article className="case-study-layout__content" ref={contentRef}>{children}</article>
        </div>
      </div>
      {caseStudy.liveUrl ? (
        <a
          className="case-study-live-cta"
          href={caseStudy.liveUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Visit Website ↗
        </a>
      ) : null}
    </FoldWrapper>
  );
}

export function getRouteFold(pathname: string, options: RouteFoldOptions = {}) {
  if (pathname === "/") {
    return <HomeFold />;
  }

  if (pathname === "/work") {
    return <WorkFold />;
  }

  if (pathname === "/experience") {
    return <ExperienceFold isTransitionOverlay={options.isTransitionOverlay} />;
  }

  if (pathname === "/about") {
    return <AboutFold />;
  }

  if (pathname === "/contact") {
    return <ContactFold />;
  }

  if (pathname.startsWith("/work/")) {
    const slug = pathname.replace("/work/", "");
    return <CaseStudyFold slug={slug} />;
  }

  const section = getSectionFromPathname(pathname);
  if (section.id === "work") {
    return <WorkFold />;
  }
  if (section.id === "experience") {
    return <ExperienceFold isTransitionOverlay={options.isTransitionOverlay} />;
  }
  if (section.id === "about") {
    return <AboutFold />;
  }
  if (section.id === "contact") {
    return <ContactFold />;
  }

  return <HomeFold />;
}
