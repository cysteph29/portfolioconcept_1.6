"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_SRC = "/work/salesforce-trailhead/video-trailhead-promo-web.mp4";
const POSTER_SRC = "/work/salesforce-trailhead/opening/solve-poster.webp";

const STILLS = [
  {
    src: "/work/salesforce-trailhead/opening/skills.webp",
    width: 1316,
    height: 1034,
    alt: "Skills employers want. A radar compares skills in demand with this developer’s skills, coverage is 39 percent, and Generate Trailmix is ready.",
    className: "trailhead-opening__still trailhead-opening__still--skills",
  },
  {
    src: "/work/salesforce-trailhead/opening/references.webp",
    width: 1320,
    height: 860,
    alt: "The end of a Solve answer about Web-to-Lead, with two Salesforce documentation references.",
    className: "trailhead-opening__still trailhead-opening__still--references",
  },
  {
    src: "/work/salesforce-trailhead/opening/trail.webp",
    width: 1764,
    height: 1006,
    alt: "The Developer Intermediate trail on Trailhead, with its badges and a Start action.",
    className: "trailhead-opening__still trailhead-opening__still--trail",
  },
] as const;

export function TrailheadProductOpening() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [inView, setInView] = useState(true);
  const [userOverride, setUserOverride] = useState<"play" | "pause" | null>(null);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
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

  const playing =
    inView &&
    !playbackBlocked &&
    (userOverride === "play" || (userOverride !== "pause" && !reduceMotion));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    const startPlayback = () => {
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

    const sync = () => {
      if (cancelled) return;

      if (!playing) {
        video.pause();
        return;
      }

      // Open on the answer. A later loop still starts at the question.
      if (video.currentTime < 0.5) {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          if (!cancelled) startPlayback();
        };
        video.addEventListener("seeked", onSeeked);
        video.currentTime = 7.5;
        return;
      }

      startPlayback();
    };

    if (video.readyState >= 2) sync();
    else video.addEventListener("loadeddata", sync);

    return () => {
      cancelled = true;
      video.removeEventListener("loadeddata", sync);
    };
  }, [playing]);

  const skills = STILLS[0];
  const references = STILLS[1];
  const trail = STILLS[2];

  return (
    <section
      aria-label="Salesforce Trailhead product"
      className="trailhead-opening"
      data-smart-navbar-hero
    >
      <div className="trailhead-opening__gallery">
        <div className="trailhead-opening__video-frame" ref={frameRef}>
          <video
            aria-label="Solve answering how to assign new leads in Salesforce. The answer cites Salesforce documentation, then the recording opens a recommended trail."
            className="trailhead-opening__video"
            loop
            muted
            playsInline
            poster={POSTER_SRC}
            preload="metadata"
            ref={videoRef}
          >
            <source src={VIDEO_SRC} type="video/mp4" />
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

        <Still still={skills} />

        <div className="trailhead-opening__row">
          <Still still={references} />
          <Still still={trail} />
        </div>
      </div>
    </section>
  );
}

function Still({ still }: { still: (typeof STILLS)[number] }) {
  return (
    <img
      alt={still.alt}
      className={still.className}
      height={still.height}
      src={still.src}
      width={still.width}
    />
  );
}
