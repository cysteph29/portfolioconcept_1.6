"use client";

import Image from "next/image";

import {
  PointerFollowLabel,
  usePointerFollowHover,
} from "@/components/ui/pointer-follow-label";

type PlaygroundCard = {
  href?: string;
  image?: string;
  title: string;
  video?: string;
};

const PLAYGROUND_CARDS: PlaygroundCard[] = [
  {
    title: "A fun way to learn coding terms for vibe-coders",
    video: "/work/playground/game video.mp4",
    href: "https://techterms.vercel.app/",
  },
  {
    title: "Automated email summaries using n8n",
    video: "/work/playground/n8n vid.mp4",
  },
  {
    title: "One of my final projects as an audio engineer for a feature film",
    image: "/work/playground/cet.jpg",
    href: "https://youtu.be/55Q-Wp7MGsI?si=c4tn7xZjhMrlm8K5",
  },
  {
    title: "Music credit lookup tool, inspired by my time as a musician and audio engineer",
    image: "/work/playground/musictool.png",
    href: "https://produced4.vercel.app/",
  },
];

function PlaygroundCardContent({ card }: { card: PlaygroundCard }) {
  return (
    <>
      <div className="playground-card__media-frame">
        {card.video ? (
          <video
            aria-label={`${card.title} preview`}
            autoPlay
            className="playground-card__media"
            loop
            muted
            playsInline
            preload="metadata"
          >
            <source src={card.video} type="video/mp4" />
          </video>
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
      <h2 className="playground-card__title text-display-3 text-text-primary">
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
        {PLAYGROUND_CARDS.map((card) => {
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
