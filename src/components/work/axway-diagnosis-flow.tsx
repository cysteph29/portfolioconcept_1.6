"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { MediaPlayback, usePlaybackOverride } from "@/components/work/media-playback";

import journey from "./trailhead-certification-journey.module.css";

import styles from "./axway-diagnosis-flow.module.css";

const steps = [
  "Notification",
  "Account",
  "Welcome",
  "Invoice list",
  "Task runs",
  "Subtasks",
  "Failed invoice",
  "Error details",
] as const;

const straightLines = [1, 2, 3, 5, 6, 7] as const;

type Route = { d: string; arrowX: number; arrowY: number };

function placement(step: number) {
  return { "--row": step > 4 ? 1 : 0, "--col": (step - 1) % 4 } as CSSProperties;
}

export function AxwayDiagnosisFlow() {
  const rootRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const [route, setRoute] = useState<Route | null>(null);
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

  // Offset metrics ignore the entrance scale, so the route stays stable mid-animation.
  useEffect(() => {
    const diagram = diagramRef.current;

    if (!diagram) {
      return;
    }

    const measure = () => {
      const stages = diagram.querySelectorAll<HTMLElement>("[data-stage]");
      const firstLine = diagram.querySelector<HTMLElement>("[data-line]");
      const from = stages[3];
      const to = stages[4];

      if (!from || !to || !firstLine) {
        return;
      }

      const box = from.firstElementChild instanceof HTMLElement ? from.firstElementChild.offsetWidth : 0;
      const first = stages[0];
      const gap = firstLine.offsetLeft - (first.offsetLeft + first.offsetWidth / 2 + box / 2);
      const startX = from.offsetLeft + from.offsetWidth / 2 + box / 2 + gap;
      const startY = from.offsetTop + box / 2;
      const edgeX = diagram.clientWidth;
      const midY = (from.offsetTop + from.offsetHeight + to.offsetTop) / 2;
      const endX = to.offsetLeft + to.offsetWidth / 2;
      const endY = to.offsetTop - gap;

      setRoute({
        d: `M ${startX} ${startY} H ${edgeX} V ${midY} H ${endX} V ${endY}`,
        arrowX: endX,
        arrowY: endY,
      });
    };

    const observer = new ResizeObserver(measure);

    measure();
    observer.observe(diagram);
    return () => observer.disconnect();
  }, []);

  const playback = usePlaybackOverride();
  const motionAllowed = playback.motionAllowed(reduced);
  const running = playback.running(motionAllowed && inView && pageVisible && sectionSettled);
  const className = [
    journey.scene,
    styles.scene,
    "media-playback-host",
    motionAllowed ? styles.isAnimated : "",
    running ? styles.isRunning : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} ref={rootRef}>
      <div className={styles.diagram} ref={diagramRef}>
        <ol
          className={styles.steps}
          aria-label="Original diagnosis flow: eight steps from the failure notification to the error details"
        >
          {steps.map((step, index) => (
            <li className={`${styles.stage} ${styles[`stage${index + 1}`]}`} data-stage key={step}>
              <span className={styles.box} aria-hidden="true">
                {index + 1}
              </span>
              <span className={styles.label}>{step}</span>
            </li>
          ))}
        </ol>
        <div aria-hidden="true">
          {straightLines.map((line) => (
            <span key={line}>
              <span
                className={`${styles.line} ${styles[`line${line}`]}`}
                data-line={line === 1 ? "" : undefined}
                style={placement(line)}
              />
              <span className={`${styles.arrow} ${styles[`arrow${line}`]}`} style={placement(line)} />
            </span>
          ))}
          {route ? (
            <>
              <svg className={styles.wrap}>
                <path d={route.d} />
              </svg>
              <span
                className={`${styles.arrow} ${styles.wrapArrow} ${styles.arrow4}`}
                style={{ left: route.arrowX, top: route.arrowY }}
              />
            </>
          ) : null}
        </div>
      </div>
      <MediaPlayback
        label="diagnosis flow"
        playing={running}
        onToggle={() => playback.toggle(running)}
      />
    </div>
  );
}
