"use client";

import { useEffect, useRef, useState } from "react";

import journey from "./trailhead-certification-journey.module.css";

import styles from "./trailhead-answer-concepts.module.css";

function Mark({
  label,
  icon,
  className,
}: {
  label: string;
  icon: React.ReactNode;
  className: string;
}) {
  return (
    <div className={`${journey.stage} ${className}`}>
      {icon}
      <span className={journey.label}>{label}</span>
    </div>
  );
}

function Logo({ src }: { src: string }) {
  return (
    <span className={styles.logo} aria-hidden="true">
      <img alt="" src={src} />
    </span>
  );
}

export function TrailheadAnswerConcepts() {
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

  const animated = !reduced;
  const running = animated && inView && pageVisible && sectionSettled;
  const sceneClassName = [journey.scene, animated ? styles.isAnimated : "", running ? styles.isRunning : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.concepts}>
      <figure className={styles.concept}>
        <div className={sceneClassName} ref={rootRef}>
          <div className={styles.fork}>
            <div className={styles.question}>
              <Mark
                className={styles.questionPair}
                label="Have a question"
                icon={<span className={`${journey.icon} ${styles.questionIcon}`} aria-hidden="true" />}
              />
            </div>
            <div className={styles.community}>
              <Mark
                className={styles.destination}
                label="Trailhead Community"
                icon={<Logo src="/work/salesforce-trailhead/logos/trailhead.svg" />}
              />
            </div>
            <div className={styles.chatgpt}>
              <Mark
                className={styles.destination}
                label="ChatGPT"
                icon={<Logo src="/work/salesforce-trailhead/logos/chatgpt.svg" />}
              />
            </div>
            <div className={styles.slack}>
              <Mark
                className={styles.destination}
                label="Slack"
                icon={<Logo src="/work/salesforce-trailhead/logos/slack.svg" />}
              />
            </div>
            <div className={`${styles.arrow} ${styles.arrowChatgpt}`} aria-hidden="true">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 0 50 H 100" />
              </svg>
            </div>
            <div className={`${styles.arrow} ${styles.arrowSlack}`} aria-hidden="true">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 0 0 L 100 100" />
              </svg>
            </div>
          </div>
        </div>
      </figure>
    </div>
  );
}
