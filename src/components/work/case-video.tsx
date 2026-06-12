import type { CSSProperties } from "react";

import { CaseVideoPlayer } from "@/components/work/case-video-player";

type CaseVideoAccessibleLabel =
  | {
      alt: string;
      "aria-label"?: string;
    }
  | {
      alt?: string;
      "aria-label": string;
    };

export type CaseVideoProps = CaseVideoAccessibleLabel & {
  src: string;
  poster: string;
  caption?: string;
  width: number;
  height: number;
};

export function CaseVideo({
  src,
  poster,
  alt,
  "aria-label": ariaLabel,
  caption,
  width,
  height,
}: CaseVideoProps) {
  const label = ariaLabel ?? alt;

  if (!label) {
    throw new Error("CaseVideo requires either an alt or aria-label prop.");
  }

  const frameStyle = {
    aspectRatio: `${width} / ${height}`,
  } satisfies CSSProperties;

  return (
    <figure className="flex flex-col gap-2">
      <div
        className="relative block w-full overflow-hidden bg-fold-fill"
        style={frameStyle}
      >
        <CaseVideoPlayer
          height={height}
          label={label}
          poster={poster}
          src={src}
          width={width}
        />
      </div>

      {caption ? (
        <figcaption className="font-pixel text-[0.625rem] leading-4 text-left text-text-muted">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
