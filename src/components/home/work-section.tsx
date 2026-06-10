"use client";

import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import {
  type CSSProperties,
  useEffect,
  useRef,
  useState,
} from "react";

import { CaseStudyCards, WORK_CASE_STUDY_COUNT } from "@/components/work/case-study-cards";

export const WORK_PIN_CARD_GAP_PX = 96;
export const WORK_PIN_EXIT_SCROLL_VH = 32;
export const WORK_PIN_SCROLL_EASING = (progress: number) => progress;

type WorkSectionStyle = CSSProperties & {
  "--work-pin-scroll-distance": string;
  "--work-pin-card-gap": string;
};

type WorkStickyStyle = CSSProperties & {
  "--work-pin-container-inline": string;
  "--work-pin-column-1-width": string;
  "--work-pin-content-top": string;
  "--work-identity-icon-size": string;
};

export function WorkSection() {
  const outerRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollDistance, setScrollDistance] = useState(0);
  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ["start start", "end end"],
  });
  const trackY = useTransform(scrollYProgress, [0, 1], [0, -scrollDistance], {
    ease: WORK_PIN_SCROLL_EASING,
  });

  useEffect(() => {
    const outer = outerRef.current;
    const sticky = stickyRef.current;
    const track = trackRef.current;
    if (!outer || !sticky || !track) {
      return;
    }

    const updateScrollDistance = () => {
      const exitScrollPx = window.innerHeight * (WORK_PIN_EXIT_SCROLL_VH / 100);
      const nextScrollDistance = Math.max(
        0,
        track.scrollHeight - sticky.clientHeight + exitScrollPx,
      );

      setScrollDistance(Math.round(nextScrollDistance));
    };

    updateScrollDistance();

    const resizeObserver = new ResizeObserver(updateScrollDistance);
    resizeObserver.observe(outer);
    resizeObserver.observe(sticky);
    resizeObserver.observe(track);
    window.addEventListener("resize", updateScrollDistance);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScrollDistance);
    };
  }, []);

  const sectionStyle: WorkSectionStyle = {
    "--work-pin-scroll-distance": `${scrollDistance}px`,
    "--work-pin-card-gap": `${WORK_PIN_CARD_GAP_PX}px`,
  };
  const stickyStyle: WorkStickyStyle = {
    "--work-pin-container-inline":
      "max(var(--spacing-home-edge-x), calc((100vw - var(--spacing-work-pin-max)) / 2))",
    "--work-pin-column-1-width": "232px",
    "--work-pin-content-top": "calc(var(--nav-height) + var(--spacing-home-stack-gap))",
    "--work-identity-icon-size": "80px",
  };
  const identityStyle: CSSProperties = {
    left: "var(--work-pin-container-inline)",
    position: "absolute",
    top: "var(--work-pin-content-top)",
    width: "var(--work-pin-column-1-width)",
    zIndex: 3,
  };
  const trackWindowStyle: CSSProperties = {
    bottom: "var(--spacing-home-safe-y)",
    left:
      "calc(var(--work-pin-container-inline) + var(--work-pin-column-1-width) + 30px)",
    position: "absolute",
    right: "var(--work-pin-container-inline)",
    top: "var(--work-pin-content-top)",
  };

  return (
    <section
      className="work-pin-section"
      id="work"
      ref={outerRef}
      style={sectionStyle}
    >
      <div className="work-pin-sticky" ref={stickyRef} style={stickyStyle}>
        <aside className="work-pin-identity" style={identityStyle}>
          <div aria-hidden="true" className="work-pin-icon-placeholder">
            <Image
              src="/assets/work-mosaic.png"
              alt=""
              width={80}
              height={80}
              className="work-pin-mosaic-image"
            />
          </div>
          <p className="work-fold__label font-pixel text-headline text-text-primary">
            Work
          </p>
        </aside>
        <div className="work-pin-track-window" style={trackWindowStyle}>
          <motion.div
            aria-label={`${WORK_CASE_STUDY_COUNT} featured case studies`}
            className="work-case-study-track"
            ref={trackRef}
            style={{ y: trackY }}
          >
            <CaseStudyCards />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
