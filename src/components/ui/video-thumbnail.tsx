"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { preload } from "react-dom";

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const PRELOAD_ROOT_MARGIN = "300px 0px";

type VideoThumbnailProps = {
  className: string;
  eager?: boolean;
  label: string;
  poster?: string;
  src: string;
};

export function VideoThumbnail({
  className,
  eager = false,
  label,
  poster,
  src,
}: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const nearRef = useRef(false);
  const inViewRef = useRef(false);
  const hasSourceRef = useRef(false);
  const reducedRef = useRef(false);
  const shouldPlayRef = useRef(false);
  const [hasSource, setHasSource] = useState(false);
  const [hasPresentedFrame, setHasPresentedFrame] = useState(false);

  if (eager && poster) {
    preload(poster, { as: "image", fetchPriority: "high" });
  }

  const attachSource = () => {
    if (hasSourceRef.current || reducedRef.current) {
      return;
    }

    if (!eager && !nearRef.current && !inViewRef.current) {
      return;
    }

    hasSourceRef.current = true;
    setHasSource(true);
  };

  const syncPlayback = () => {
    const video = videoRef.current;

    if (!video || !hasSourceRef.current) {
      return;
    }

    video.muted = true;
    const shouldPlay = inViewRef.current && !document.hidden && !reducedRef.current;
    shouldPlayRef.current = shouldPlay;

    if (!shouldPlay) {
      video.pause();
      return;
    }

    void video.play().then(() => {
      if (!shouldPlayRef.current) {
        video.pause();
      }
    }).catch(() => {});
  };

  useLayoutEffect(() => {
    const motion = window.matchMedia(MOTION_QUERY);

    const onMotionChange = () => {
      reducedRef.current = motion.matches;

      if (!motion.matches) {
        attachSource();
      }

      syncPlayback();
    };

    onMotionChange();
    motion.addEventListener("change", onMotionChange);

    return () => motion.removeEventListener("change", onMotionChange);
    // attachSource and syncPlayback close over the latest refs and setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eager]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const preloadObserver = new IntersectionObserver(
      ([entry]) => {
        nearRef.current = entry?.isIntersecting ?? false;

        if (nearRef.current) {
          attachSource();
        }
      },
      { rootMargin: PRELOAD_ROOT_MARGIN, threshold: 0 },
    );

    const playObserver = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry?.isIntersecting ?? false;
        syncPlayback();
      },
      { rootMargin: "0px", threshold: 0 },
    );

    const onVisibilityChange = () => {
      syncPlayback();
    };

    const onCanPlay = () => {
      syncPlayback();
    };

    preloadObserver.observe(video);
    playObserver.observe(video);
    document.addEventListener("visibilitychange", onVisibilityChange);
    video.addEventListener("canplay", onCanPlay);

    return () => {
      preloadObserver.disconnect();
      playObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      video.removeEventListener("canplay", onCanPlay);
      video.pause();
    };
    // Observers bind once; playback reads refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hasSource) {
      syncPlayback();
    }
    // Re-check playback once the source element is committed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSource]);

  const showPosterOverlay = Boolean(poster) && !eager && !hasPresentedFrame;

  return (
    <>
      <video
        aria-label={label}
        className={className}
        loop
        muted
        onPlaying={() => setHasPresentedFrame(true)}
        playsInline
        poster={eager ? poster : undefined}
        preload={hasSource ? "auto" : "none"}
        ref={videoRef}
      >
        {hasSource ? <source src={src} type="video/mp4" /> : null}
      </video>
      {showPosterOverlay ? (
        <img
          alt=""
          className="video-thumbnail__poster"
          decoding="async"
          fetchPriority="low"
          loading="lazy"
          src={poster}
        />
      ) : null}
    </>
  );
}
