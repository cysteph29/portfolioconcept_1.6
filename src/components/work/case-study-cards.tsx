"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type PointerEvent, useState } from "react";
import { createPortal } from "react-dom";

import { CASE_STUDIES } from "@/config/case-studies";

const FEATURED_CASE_STUDIES = CASE_STUDIES.slice(0, 3);
const WORK_CASE_STUDY_HOVER_OFFSET_X_PX = 8;

export const WORK_CASE_STUDY_COUNT = FEATURED_CASE_STUDIES.length;

export function CaseStudyCards() {
  const [hoveredCard, setHoveredCard] = useState<{
    slug: string;
    x: number;
    y: number;
  } | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const updateHoveredCard = (event: PointerEvent<HTMLElement>, slug: string) => {
    if (event.pointerType !== "mouse") {
      return;
    }

    setHoveredCard({
      slug,
      x: event.clientX + WORK_CASE_STUDY_HOVER_OFFSET_X_PX,
      y: event.clientY,
    });
  };

  return (
    <div className="work-case-study-list" role="list">
      {FEATURED_CASE_STUDIES.map((caseStudy) => (
        <Link
          key={caseStudy.slug}
          className="work-case-study-card"
          href={`/work/${caseStudy.slug}`}
          onPointerEnter={(event) => {
            updateHoveredCard(event, caseStudy.slug);
          }}
          onPointerLeave={() => {
            setHoveredCard(null);
          }}
          onPointerMove={(event) => {
            updateHoveredCard(event, caseStudy.slug);
          }}
          role="listitem"
        >
          <article className="work-case-study-card__feature">
            <div className="work-case-study-card__media">
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
            </div>
            <h2 className="work-case-study-card__title text-display-3 text-text-primary">
              {caseStudy.cardTitle ?? caseStudy.title}
            </h2>
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
          </article>
        </Link>
      ))}
      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {hoveredCard ? (
                <motion.span
                  key="case-study-hover"
                  aria-hidden="true"
                  className="work-case-study-card__hover"
                  initial={false}
                  animate={{ opacity: 1 }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.12, ease: [0.16, 1, 0.3, 1] },
                  }}
                  style={{ left: hoveredCard.x, top: hoveredCard.y }}
                >
                  <motion.span
                    className="work-case-study-card__hover-square"
                    initial={{ opacity: 0 }}
                    animate={
                      shouldReduceMotion
                        ? { opacity: 1 }
                        : { opacity: [0, 1, 0, 1, 0, 1, 0, 1] }
                    }
                    transition={
                      shouldReduceMotion
                        ? { duration: 0.14, ease: [0.16, 1, 0.3, 1] }
                        : {
                            duration: 0.38,
                            times: [0, 0.1, 0.22, 0.36, 0.48, 0.62, 0.74, 1],
                            ease: "linear",
                          }
                    }
                  />
                  <span className="work-case-study-card__hover-label">VIEW CASE STUDY</span>
                </motion.span>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
