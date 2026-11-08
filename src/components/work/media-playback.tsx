"use client";

import { useState } from "react";

type MediaPlaybackProps = {
  playing: boolean;
  label: string;
  onToggle: () => void;
};

export function MediaPlayback({ playing, label, onToggle }: MediaPlaybackProps) {
  const action = playing ? "Pause" : "Play";

  return (
    <button
      type="button"
      className="media-playback"
      data-playing={playing ? "" : undefined}
      aria-label={`${action} ${label}`}
      onClick={onToggle}
    >
      <span className="media-playback__icon" aria-hidden="true" />
      <span className="media-playback__label">{action}</span>
    </button>
  );
}

export function usePlaybackOverride() {
  const [override, setOverride] = useState<"play" | "pause" | null>(null);

  return {
    motionAllowed(reduced: boolean) {
      return !reduced || override !== null;
    },
    running(auto: boolean) {
      return auto && override !== "pause";
    },
    toggle(playing: boolean) {
      setOverride(playing ? "pause" : "play");
    },
  };
}
