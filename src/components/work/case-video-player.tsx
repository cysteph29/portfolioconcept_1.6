"use client";

import { useEffect, useRef, useState } from "react";

import { MediaPlayback } from "@/components/work/media-playback";

type CaseVideoPlayerProps = {
  src: string;
  poster: string;
  label: string;
  width: number;
  height: number;
  playbackLabel?: string;
};

export function CaseVideoPlayer({
  src,
  poster,
  label,
  width,
  height,
  playbackLabel,
}: CaseVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isIntersectingRef = useRef(false);
  const userPausedRef = useRef(false);
  const [hasLoadedSource, setHasLoadedSource] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const syncPlaying = () => setPlaying(!video.paused && !video.ended);

    const playIfAllowed = () => {
      if (!isIntersectingRef.current || userPausedRef.current) {
        video.pause();
        return;
      }

      void video.play().catch(() => {
        // Autoplay can be denied by browser/user settings; the poster remains visible.
      });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersectingRef.current = entry?.isIntersecting ?? false;

        if (isIntersectingRef.current) setHasLoadedSource(true);

        playIfAllowed();
      },
      {
        rootMargin: "200px 0px",
        threshold: 0.2,
      },
    );

    observer.observe(video);
    video.addEventListener("play", syncPlaying);
    video.addEventListener("pause", syncPlaying);

    return () => {
      observer.disconnect();
      video.removeEventListener("play", syncPlaying);
      video.removeEventListener("pause", syncPlaying);
      video.pause();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !hasLoadedSource) return;

    video.load();

    if (isIntersectingRef.current && !userPausedRef.current) {
      void video.play().catch(() => {
        // Autoplay can be denied by browser/user settings; the poster remains visible.
      });
    }
  }, [hasLoadedSource, src]);

  return (
    <>
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
      {playbackLabel ? (
        <MediaPlayback
          label={playbackLabel}
          playing={playing}
          onToggle={() => {
            const video = videoRef.current;

            if (!video) return;

            if (!video.paused) {
              userPausedRef.current = true;
              video.pause();
              return;
            }

            userPausedRef.current = false;
            setHasLoadedSource(true);
            void video.play().catch(() => {
              // Playback can still be denied; the poster remains visible.
            });
          }}
        />
      ) : null}
    </>
  );
}
