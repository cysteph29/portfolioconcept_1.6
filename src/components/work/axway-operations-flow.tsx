"use client";

import { useEffect, useRef, useState } from "react";

import { MediaPlayback, usePlaybackOverride } from "@/components/work/media-playback";

import journey from "./trailhead-certification-journey.module.css";

import styles from "./axway-operations-flow.module.css";

function Line({ className }: { className: string }) {
  return <li className={`${journey.line} ${className}`} role="presentation" aria-hidden="true" />;
}

export function AxwayOperationsFlow() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(true);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [sectionSettled, setSectionSettled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(media.matches);

    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const node = rootRef.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.35,
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onChange = () => setPageVisible(document.visibilityState === "visible");

    onChange();
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  useEffect(() => {
    const section = rootRef.current?.closest<HTMLElement>(".case-study-section");

    if (!section) {
      setSectionSettled(true);
      return;
    }

    const check = () => {
      if (
        section.classList.contains("case-study-section--revealed") &&
        getComputedStyle(section).opacity === "1" &&
        section.getAnimations().length === 0
      ) {
        setSectionSettled(true);
      }
    };
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target === section) {
        check();
      }
    };
    const mutations = new MutationObserver(check);

    check();
    mutations.observe(section, { attributes: true, attributeFilter: ["class"] });
    section.addEventListener("transitionend", onTransitionEnd);
    return () => {
      mutations.disconnect();
      section.removeEventListener("transitionend", onTransitionEnd);
    };
  }, []);

  const playback = usePlaybackOverride();
  const motionAllowed = playback.motionAllowed(reduced);
  const running = playback.running(motionAllowed && inView && pageVisible && sectionSettled);
  const className = [
    journey.scene,
    "media-playback-host",
    motionAllowed ? `${journey.isAnimated} ${styles.isAnimated}` : "",
    running ? `${journey.isRunning} ${styles.isRunning}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} ref={rootRef}>
      <ol
        className={`${journey.journey} ${styles.journey}`}
        aria-label="When an invoice fails, Operations steps in, diagnoses the cause, then fixes it. The project focused on diagnosis."
      >
        <li className={`${journey.stage} ${styles.stage1}`}>
          <span className={`${journey.icon} ${styles.iconInvoice}`} aria-hidden="true" />
          <span className={journey.label}>Invoice fails</span>
        </li>
        <Line className={styles.line1} />
        <li className={`${journey.stage} ${styles.stage2}`}>
          <span className={`${journey.icon} ${styles.iconUsers}`} aria-hidden="true" />
          <span className={journey.label}>Operations steps in</span>
        </li>
        <Line className={styles.line2} />
        <li className={`${journey.stage} ${styles.stage3} ${styles.focusStage}`}>
          <span className={`${journey.icon} ${styles.iconMagnifier}`} aria-hidden="true" />
          <span className={journey.label}>Diagnose</span>
          <span className={styles.focus}>This project</span>
          <span className={styles.focusBox} aria-hidden="true" />
        </li>
        <Line className={styles.line3} />
        <li className={`${journey.stage} ${styles.stage4}`}>
          <span className={`${journey.icon} ${styles.iconWrench}`} aria-hidden="true" />
          <span className={journey.label}>Fix</span>
        </li>
      </ol>
      <MediaPlayback
        label="operations flow"
        playing={running}
        onToggle={() => playback.toggle(running)}
      />
    </div>
  );
}
