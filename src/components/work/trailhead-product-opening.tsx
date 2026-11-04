"use client";

import { useEffect, useRef, useState } from "react";

import { getCaseStudyBySlug } from "@/config/case-studies";

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Same media the homepage project card uses for Salesforce Trailhead.
 * The card reads these fields from the published case study, not the preview.
 */
const thumbnail = getCaseStudyBySlug("salesforce-trailhead");
const VIDEO_SRC = thumbnail?.heroVideo ?? "";
const POSTER_SRC = thumbnail?.heroPoster ?? "";

export function TrailheadProductOpening() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [inView, setInView] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [userOverride, setUserOverride] = useState<"play" | "pause" | null>(null);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(MOTION_QUERY);
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { threshold: 0.35 },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const allowSource = Boolean(VIDEO_SRC) && (!reduceMotion || userOverride === "play");
  const playing =
    allowSource &&
    inView &&
    !hidden &&
    !playbackBlocked &&
    (userOverride === "play" || (userOverride !== "pause" && !reduceMotion));

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !allowSource) return;

    let cancelled = false;

    const startPlayback = () => {
      if (cancelled || !playing) {
        video.pause();
        return;
      }

      void video.play().then(
        () => {
          if (!cancelled) setPlaybackBlocked(false);
        },
        (error: unknown) => {
          if (cancelled) return;
          const name = error instanceof DOMException ? error.name : "";
          if (name === "AbortError") return;
          setPlaybackBlocked(true);
        },
      );
    };

    if (video.readyState >= 2) startPlayback();
    else video.addEventListener("loadeddata", startPlayback);

    return () => {
      cancelled = true;
      video.removeEventListener("loadeddata", startPlayback);
      video.pause();
    };
  }, [allowSource, playing]);

  return (
    <section className="trailhead-opening" data-smart-navbar-hero>
      <div className="trailhead-opening__frame" ref={frameRef}>
        <video
          aria-label="Salesforce Trailhead hero visual"
          className="trailhead-opening__video"
          height={1080}
          loop
          muted
          playsInline
          poster={POSTER_SRC || undefined}
          preload={allowSource ? "auto" : "none"}
          ref={videoRef}
          width={1920}
        >
          {allowSource ? <source src={VIDEO_SRC} type="video/mp4" /> : null}
        </video>
        <button
          type="button"
          className="trailhead-opening__playback"
          data-playing={playing ? "" : undefined}
          aria-label={playing ? "Pause product video" : "Play product video"}
          onClick={() => {
            if (playing) {
              setUserOverride("pause");
              return;
            }
            setPlaybackBlocked(false);
            setUserOverride("play");
          }}
        >
          <span className="trailhead-opening__playback-icon" aria-hidden="true" />
          <span className="trailhead-opening__playback-label">{playing ? "Pause" : "Play"}</span>
        </button>
      </div>
    </section>
  );
}
