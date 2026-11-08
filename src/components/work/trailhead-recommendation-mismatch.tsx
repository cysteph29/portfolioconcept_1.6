"use client";

import { useEffect, useRef, useState } from "react";

import { MediaPlayback, usePlaybackOverride } from "@/components/work/media-playback";

import styles from "./trailhead-recommendation-mismatch.module.css";

export function TrailheadRecommendationMismatch() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(true);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

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

  const playback = usePlaybackOverride();
  const motionAllowed = playback.motionAllowed(reduced);
  const running = playback.running(motionAllowed && inView && pageVisible);
  const className = [
    styles.scene,
    "media-playback-host",
    motionAllowed ? styles.isAnimated : "",
    running ? styles.isRunning : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} ref={rootRef}>
      <div className={styles.rig}>
        <div className={styles.pairs}>
          <div className={`${styles.pair} ${styles.pairLeft}`}>
            <div className={styles.pairInner}>
              <span className={`${styles.icon} ${styles.iconUsers}`} aria-hidden="true" />
              <span className={styles.label}>User expectations</span>
            </div>
          </div>
          <div className={`${styles.pair} ${styles.pairRight}`}>
            <div className={styles.pairInner}>
              <span className={`${styles.icon} ${styles.iconBook}`} aria-hidden="true" />
              <span className={styles.label}>Recommendations</span>
            </div>
          </div>
        </div>
        <div className={styles.seesaw} aria-hidden="true">
          <span className={styles.beam}>
            <span className={styles.beamLine} />
          </span>
          <svg className={styles.fulcrum} viewBox="0 0 6 5" preserveAspectRatio="none">
            <polygon points="3,0 6,5 0,5" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </div>
      <MediaPlayback
        label="recommendation comparison"
        playing={running}
        onToggle={() => playback.toggle(running)}
      />
    </div>
  );
}
