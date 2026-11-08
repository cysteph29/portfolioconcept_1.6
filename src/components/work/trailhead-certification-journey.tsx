"use client";

import { useEffect, useRef, useState } from "react";

import { MediaPlayback, usePlaybackOverride } from "@/components/work/media-playback";

import styles from "./trailhead-certification-journey.module.css";

function Line({ className }: { className: string }) {
  return <li className={`${styles.line} ${className}`} role="presentation" aria-hidden="true" />;
}

export function TrailheadCertificationJourney() {
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
      <ol className={styles.journey}>
        <li className={`${styles.stage} ${styles.learn}`}>
          <span className={`${styles.icon} ${styles.iconBook}`} aria-hidden="true" />
          <span className={styles.label}>Learn</span>
        </li>
        <Line className={styles.lineFirst} />
        <li className={`${styles.stage} ${styles.certified}`}>
          <span className={`${styles.icon} ${styles.iconCertified}`} aria-hidden="true" />
          <span className={styles.label}>Get certified</span>
        </li>
        <Line className={styles.lineSecond} />
        <li className={`${styles.stage} ${styles.stop}`}>
          <span className={`${styles.icon} ${styles.iconExit}`} aria-hidden="true" />
          <span className={styles.label}>Stop returning</span>
        </li>
      </ol>
      <MediaPlayback
        label="certification journey"
        playing={running}
        onToggle={() => playback.toggle(running)}
      />
    </div>
  );
}
