"use client";

import { useEffect, useRef, useState } from "react";

type CaseVideoPlayerProps = {
  src: string;
  poster: string;
  label: string;
  width: number;
  height: number;
};

export function CaseVideoPlayer({
  src,
  poster,
  label,
  width,
  height,
}: CaseVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isIntersectingRef = useRef(false);
  const [hasLoadedSource, setHasLoadedSource] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry?.isIntersecting ?? false;
        isIntersectingRef.current = isIntersecting;

        if (isIntersecting) {
          setHasLoadedSource(true);
          void video.play().catch(() => {
            // Autoplay can be denied by browser/user settings; the poster remains visible.
          });
        } else {
          video.pause();
        }
      },
      {
        rootMargin: "200px 0px",
        threshold: 0.2,
      },
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
      video.pause();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !hasLoadedSource) return;

    video.load();

    if (isIntersectingRef.current) {
      void video.play().catch(() => {
        // Autoplay can be denied by browser/user settings; the poster remains visible.
      });
    }
  }, [hasLoadedSource, src]);

  return (
    <video
      aria-label={label}
      className="block h-full w-full object-contain"
      height={height}
      loop
      muted
      playsInline
      poster={poster}
      preload="none"
      ref={videoRef}
      width={width}
    >
      {hasLoadedSource ? <source src={src} type="video/mp4" /> : null}
    </video>
  );
}
