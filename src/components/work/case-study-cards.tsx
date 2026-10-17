"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import { ReviewLink } from "@/components/navigation/review-link";
import {
  PointerFollowLabel,
  usePointerFollowHover,
} from "@/components/ui/pointer-follow-label";
import { CASE_STUDIES } from "@/config/case-studies";
import { PLAYGROUND_PROJECTS } from "@/config/playground";

const FEATURED_CASE_STUDIES = CASE_STUDIES.slice(0, 3);
const CASE_STUDY_HOVER_LABEL = "VIEW CASE STUDY";
const PLAYGROUND_HOVER_LABEL = "TAKE ME THERE";
const CASE_STUDY_TYPE_LABEL = "Case study";
const WEB_TYPE_LABEL = "Web";

type WorkGridCard = {
  external: boolean;
  hoverLabel?: string;
  href?: string;
  id: string;
  image?: string;
  mediaLabel: string;
  poster?: string;
  title: string;
  typeLabel: string;
  video?: string;
};

function isExternalHref(href: string) {
  return /^[a-z][a-z0-9+.-]*:/i.test(href);
}

const WORK_GRID_CARDS: WorkGridCard[] = [
  ...FEATURED_CASE_STUDIES.map((caseStudy) => ({
    id: caseStudy.slug,
    title: caseStudy.cardTitle ?? caseStudy.title,
    mediaLabel: `${caseStudy.title} hero visual`,
    video: caseStudy.heroVideo,
    poster: caseStudy.heroPoster,
    href: `/work/${caseStudy.slug}`,
    external: false,
    hoverLabel: CASE_STUDY_HOVER_LABEL,
    typeLabel: CASE_STUDY_TYPE_LABEL,
  })),
  ...PLAYGROUND_PROJECTS.map((project) => ({
    id: project.video ?? project.image ?? project.title,
    title: project.title,
    mediaLabel: `${project.title} hero visual`,
    video: project.video,
    image: project.image,
    href: project.href,
    external: project.href ? isExternalHref(project.href) : false,
    hoverLabel: project.href ? PLAYGROUND_HOVER_LABEL : undefined,
    typeLabel: project.typeLabel ?? WEB_TYPE_LABEL,
  })),
];

function WorkCardMedia({ card }: { card: WorkGridCard }) {
  if (card.video) {
    return (
      <div className="work-case-study-card__media">
        <video
          aria-label={card.mediaLabel}
          autoPlay
          className="work-case-study-card__video"
          loop
          muted
          playsInline
          poster={card.poster || undefined}
          preload="metadata"
        >
          <source src={card.video} type="video/mp4" />
        </video>
      </div>
    );
  }

  if (card.image) {
    return (
      <div className="work-case-study-card__media work-case-study-card__still">
        <Image
          alt=""
          className="work-case-study-card__still-image"
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1099px) 50vw, 34vw"
          src={card.image}
          style={{ objectFit: "contain" }}
        />
      </div>
    );
  }

  return (
    <div className="work-case-study-card__media">
      <div aria-label={card.mediaLabel} className="work-case-study-card__placeholder" role="img" />
    </div>
  );
}

function WorkProjectCard({
  card,
  getHoverHandlers,
  titleClassName,
}: {
  card: WorkGridCard;
  getHoverHandlers: ReturnType<typeof usePointerFollowHover>["getHoverHandlers"];
  titleClassName: string;
}) {
  const handlers = card.hoverLabel ? getHoverHandlers(card.id) : undefined;
  const body = (
    <article className="work-case-study-card__feature">
      <WorkCardMedia card={card} />
      <div className="work-case-study-card__copy">
        <p className="work-case-study-card__type text-heading-5 text-text-muted">{card.typeLabel}</p>
        <h3 className={`work-case-study-card__title text-text-primary ${titleClassName}`}>{card.title}</h3>
      </div>
    </article>
  );

  if (!card.href) {
    return <div className="work-case-study-card">{body}</div>;
  }

  if (card.external) {
    return (
      <a
        className="work-case-study-card"
        href={card.href}
        rel="noopener noreferrer"
        target="_blank"
        {...handlers}
      >
        {body}
      </a>
    );
  }

  return (
    <ReviewLink className="work-case-study-card" href={card.href} {...handlers}>
      {body}
    </ReviewLink>
  );
}

export function CaseStudyCards() {
  const listRef = useRef<HTMLDivElement>(null);
  const { hover, getHoverHandlers } = usePointerFollowHover();
  const hoverLabel = hover
    ? WORK_GRID_CARDS.find((card) => card.id === hover.id)?.hoverLabel
    : undefined;

  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }

    const videos = [...list.querySelectorAll("video")];
    const visibleVideos = new WeakSet<HTMLVideoElement>();

    const playIfVisible = (video: HTMLVideoElement) => {
      if (!visibleVideos.has(video)) {
        return;
      }

      void video.play().catch(() => {});
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!(entry.target instanceof HTMLVideoElement)) {
            return;
          }

          if (entry.isIntersecting) {
            visibleVideos.add(entry.target);
            playIfVisible(entry.target);
            return;
          }

          visibleVideos.delete(entry.target);
          entry.target.pause();
        });
      },
      { rootMargin: "100px 0px", threshold: 0 },
    );

    const handleCanPlay = (event: Event) => {
      if (event.currentTarget instanceof HTMLVideoElement) {
        playIfVisible(event.currentTarget);
      }
    };

    videos.forEach((video) => {
      observer.observe(video);
      video.addEventListener("canplay", handleCanPlay);
    });

    return () => {
      observer.disconnect();
      videos.forEach((video) => video.removeEventListener("canplay", handleCanPlay));
    };
  }, []);

  const featuredCards = WORK_GRID_CARDS.slice(0, FEATURED_CASE_STUDIES.length);
  const playCards = WORK_GRID_CARDS.slice(FEATURED_CASE_STUDIES.length);

  return (
    <div className="editorial-work__projects" ref={listRef}>
      <div className="editorial-work__featured" role="list">
        {featuredCards.map((card) => (
          <div key={card.id} role="listitem">
            <WorkProjectCard
              card={card}
              getHoverHandlers={getHoverHandlers}
              titleClassName="editorial-featured-title"
            />
          </div>
        ))}
      </div>
      <div className="editorial-work__play" role="list">
        {playCards.map((card) => (
          <div key={card.id} role="listitem">
            <WorkProjectCard
              card={card}
              getHoverHandlers={getHoverHandlers}
              titleClassName="editorial-play-title"
            />
          </div>
        ))}
      </div>
      <PointerFollowLabel hover={hoverLabel ? hover : null} label={hoverLabel ?? ""} />
    </div>
  );
}
