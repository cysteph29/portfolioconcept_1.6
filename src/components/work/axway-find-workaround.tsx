"use client";

import { useEffect, useId, useRef, useState } from "react";

import styles from "./axway-find-workaround.module.css";

const STAMP = "10:42:18";

export function AxwayFindWorkaround() {
  const captionId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [userPaused, setUserPaused] = useState(false);
  const [userStarted, setUserStarted] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(media.matches);

    onChange();
    setMounted(true);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const node = rootRef.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.2,
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

  const allowMotion = mounted && (!reduced || userStarted);
  const running = allowMotion && inView && pageVisible && !userPaused;

  const onToggle = () => {
    if (running) {
      setUserPaused(true);
      return;
    }

    setUserStarted(true);
    setUserPaused(false);
  };

  return (
    <figure
      ref={rootRef}
      className={[styles.root, allowMotion ? styles.isAnimated : "", running ? styles.isRunning : ""]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby={captionId}
    >
      <div className={styles.stage} aria-hidden="true">
        <div className={styles.column}>
          <p className={styles.label}>Email notification</p>
          <div className={`${styles.panel} ${styles.email}`}>
            <div className={styles.emailHead}>
              <span className={styles.dot} />
              <p className={styles.kicker}>Notification</p>
            </div>
            <p className={styles.subject}>Processing failed</p>
            <div className={styles.lines}>
              <span className={styles.line} />
              <span className={`${styles.line} ${styles.lineShort}`} />
            </div>
            <p className={`${styles.stamp} ${styles.emailTime}`}>{STAMP}</p>
            <span className={`${styles.line} ${styles.lineShort}`} />
          </div>
        </div>

        <div className={styles.column}>
          <p className={styles.label}>Task screen</p>
          <div className={`${styles.panel} ${styles.task}`}>
            <div className={styles.chrome}>
              <div className={styles.controls}>
                <span className={styles.control} />
                <span className={styles.control} />
                <span className={styles.control} />
              </div>
              <div className={styles.findSlot}>
                <div className={styles.find}>
                  <span className={styles.findLabel}>Find</span>
                  <span className={`${styles.query} ${styles.stamp}`}>
                    {STAMP.split("").map((character, index) => (
                      <span key={`${character}-${index}`} className={styles.char}>
                        {character}
                      </span>
                    ))}
                    <span className={styles.caret} />
                  </span>
                  <span className={styles.count}>1/1</span>
                </div>
                <div className={styles.keys}>
                  <span className={`${styles.key} ${styles.keyCtrl}`}>Ctrl</span>
                  <span className={styles.plus}>+</span>
                  <span className={styles.key}>F</span>
                </div>
              </div>
            </div>
            <div className={styles.product}>
              <div className={styles.table}>
                <div className={styles.head}>
                  <span>Task</span>
                  <span>Status</span>
                  <span className={styles.timeCol}>Time</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.cell}>
                    <span className={styles.bar} style={{ width: "78%" }} />
                  </span>
                  <span className={styles.cell}>
                    <span className={styles.bar} style={{ width: "72%" }} />
                  </span>
                  <span className={styles.timeCol}>
                    <span className={styles.bar} style={{ width: "4.5rem" }} />
                  </span>
                </div>
                <div className={styles.row}>
                  <span className={styles.cell}>
                    <span className={styles.bar} style={{ width: "58%" }} />
                  </span>
                  <span className={styles.cell}>
                    <span className={styles.bar} style={{ width: "64%" }} />
                  </span>
                  <span className={`${styles.stamp} ${styles.timeCol} ${styles.match}`}>{STAMP}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.cell}>
                    <span className={styles.bar} style={{ width: "70%" }} />
                  </span>
                  <span className={styles.cell}>
                    <span className={styles.bar} style={{ width: "70%" }} />
                  </span>
                  <span className={styles.timeCol}>
                    <span className={styles.bar} style={{ width: "3.75rem" }} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <figcaption className={styles.footer}>
        <span id={captionId} className={styles.caption}>
          Illustration of the existing workaround.
        </span>
        <button
          type="button"
          className={styles.playback}
          data-playing={running ? "" : undefined}
          aria-label={running ? "Pause illustration" : "Play illustration"}
          onClick={onToggle}
        >
          <span className={styles.playbackIcon} aria-hidden="true" />
          {running ? "Pause" : "Play"}
        </button>
      </figcaption>
    </figure>
  );
}
