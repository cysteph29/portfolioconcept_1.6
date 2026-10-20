"use client";

import Image from "next/image";

import {
  PointerFollowLabel,
  usePointerFollowHover,
} from "@/components/ui/pointer-follow-label";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import {
  PLAYGROUND_COMING_SOON_LABEL,
  PLAYGROUND_PROJECTS,
  type PlaygroundProject,
} from "@/config/playground";

const OPEN_LABEL = "TAKE ME THERE";

function cardKey(card: PlaygroundProject) {
  return card.video ?? card.image ?? card.title;
}

function cardHoverLabel(card: PlaygroundProject) {
  if (card.comingSoon) {
    return PLAYGROUND_COMING_SOON_LABEL;
  }

  if (card.href) {
    return OPEN_LABEL;
  }

  return null;
}

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
  const hoverLabel = hover
    ? PLAYGROUND_PROJECTS.map((card) => ({
        key: cardKey(card),
        label: cardHoverLabel(card),
      })).find((card) => card.key === hover.id)?.label
    : null;

  return (
    <section aria-label="Playground projects" className="playground-gallery">
      <div className="playground-gallery__grid">
        {PLAYGROUND_PROJECTS.map((card) => {
          const key = cardKey(card);
          const label = cardHoverLabel(card);
          const content = <PlaygroundCardContent card={card} />;

          if (card.href && !card.comingSoon) {
            return (
              <a
                className="playground-card"
                href={card.href}
                key={key}
                rel="noopener noreferrer"
                target="_blank"
                {...getHoverHandlers(key)}
              >
                {content}
              </a>
            );
          }

          return (
            <article
              className="playground-card"
              key={key}
              {...(label ? getHoverHandlers(key) : {})}
            >
              {content}
            </article>
          );
        })}
      </div>
      <PointerFollowLabel hover={hoverLabel ? hover : null} label={hoverLabel ?? ""} />
    </section>
  );
}
