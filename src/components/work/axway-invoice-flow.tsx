"use client";

import { useEffect, useRef, useState } from "react";

import { MediaPlayback, usePlaybackOverride } from "@/components/work/media-playback";

import journey from "./trailhead-certification-journey.module.css";

import styles from "./axway-invoice-flow.module.css";

function Line({ className }: { className: string }) {
  return <li className={`${journey.line} ${className}`} role="presentation" aria-hidden="true" />;
}

export function AxwayInvoiceFlow() {
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
    motionAllowed ? journey.isAnimated : "",
    running ? journey.isRunning : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} ref={rootRef}>
      <ol
        className={journey.journey}
        aria-label="Invoice flow: the sender’s invoice goes through Axway, then reaches the receiver"
      >
        <li className={`${journey.stage} ${journey.learn}`}>
          <span className={`${journey.icon} ${styles.iconBuilding}`} aria-hidden="true" />
          <span className={journey.label}>Sender</span>
        </li>
        <Line className={journey.lineFirst} />
        <li className={`${journey.stage} ${journey.certified}`}>
          <span className={`${journey.icon} ${styles.iconAxway}`} aria-hidden="true" />
          <span className={journey.label}>Axway</span>
        </li>
        <Line className={journey.lineSecond} />
        <li className={`${journey.stage} ${journey.stop}`}>
          <span className={`${journey.icon} ${styles.iconBuilding}`} aria-hidden="true" />
          <span className={journey.label}>Receiver</span>
        </li>
      </ol>
      <MediaPlayback
        label="invoice flow"
        playing={running}
        onToggle={() => playback.toggle(running)}
      />
    </div>
  );
}
