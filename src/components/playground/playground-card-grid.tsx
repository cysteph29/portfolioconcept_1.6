"use client";

import Image from "next/image";

import {
  PointerFollowLabel,
  usePointerFollowHover,
} from "@/components/ui/pointer-follow-label";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import { PLAYGROUND_PROJECTS, type PlaygroundProject } from "@/config/playground";

function PlaygroundCardContent({ card }: { card: PlaygroundProject }) {
  return (
    <>
      <div className="playground-card__media-frame">
        {card.video ? (
          <VideoThumbnail
            className="playground-card__media"
            label={`${card.title} preview`}
            poster={card.poster}
            src={card.video}
          />
        ) : card.image ? (
          <Image
            alt=""
            className="playground-card__media"
            fill
            sizes="(max-width: 767px) 100vw, 50vw"
            src={card.image}
          />
        ) : null}
      </div>
      <h2 className="playground-card__title text-heading-2 text-text-primary">
        {card.title}
      </h2>
    </>
  );
}

export function PlaygroundCardGrid() {
  const { hover, getHoverHandlers } = usePointerFollowHover();

  return (
    <section aria-label="Playground projects" className="playground-gallery">
      <div className="playground-gallery__grid">
        {PLAYGROUND_PROJECTS.map((card) => {
          const key = card.video ?? card.image ?? card.title;

          return card.href ? (
            <a
              className="playground-card"
              href={card.href}
              key={key}
              rel="noopener noreferrer"
              target="_blank"
              {...getHoverHandlers(key)}
            >
              <PlaygroundCardContent card={card} />
            </a>
          ) : (
            <article className="playground-card" key={key}>
              <PlaygroundCardContent card={card} />
            </article>
          );
        })}
      </div>
      <PointerFollowLabel hover={hover} label="TAKE ME THERE" />
    </section>
  );
}
