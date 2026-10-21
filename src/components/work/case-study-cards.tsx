"use client";

import Image from "next/image";

import { ReviewLink } from "@/components/navigation/review-link";
import {
  PointerFollowLabel,
  usePointerFollowHover,
} from "@/components/ui/pointer-follow-label";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import { CASE_STUDIES } from "@/config/case-studies";
import {
  PLAYGROUND_COMING_SOON_LABEL,
  PLAYGROUND_PROJECTS,
} from "@/config/playground";

const FEATURED_CASE_STUDIES = CASE_STUDIES.slice(0, 3);
const CASE_STUDY_HOVER_LABEL = "VIEW CASE STUDY";
const PLAYGROUND_HOVER_LABEL = "TAKE ME THERE";
const CASE_STUDY_TYPE_LABEL = "Case study";
const WEB_TYPE_LABEL = "Web";

type WorkGridCard = {
  external: boolean;
  featured: boolean;
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
    featured: true,
  })),
  ...PLAYGROUND_PROJECTS.filter((project) => !project.hiddenFromHome).map((project) => ({
    id: project.video ?? project.image ?? project.title,
    title: project.title,
    mediaLabel: `${project.title} hero visual`,
    video: project.video,
    poster: project.poster,
    image: project.image,
    href: project.comingSoon ? undefined : project.href,
    external:
      project.href !== undefined && !project.comingSoon
        ? isExternalHref(project.href)
        : false,
    hoverLabel: project.comingSoon
      ? PLAYGROUND_COMING_SOON_LABEL
      : project.href
        ? PLAYGROUND_HOVER_LABEL
        : undefined,
    typeLabel: project.typeLabel ?? WEB_TYPE_LABEL,
    featured: project.featured === true,
  })),
];

const FEATURED_WORK_CARDS = WORK_GRID_CARDS.filter((card) => card.featured);
const COMPACT_WORK_CARDS = WORK_GRID_CARDS.filter((card) => !card.featured);

function WorkCardMedia({ card, eager = false }: { card: WorkGridCard; eager?: boolean }) {
  if (card.video) {
    return (
      <div className="work-case-study-card__media">
        <VideoThumbnail
          className="work-case-study-card__video"
          eager={eager}
          label={card.mediaLabel}
          poster={card.poster}
          src={card.video}
        />
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
  eager = false,
  getHoverHandlers,
  titleClassName,
}: {
  card: WorkGridCard;
  eager?: boolean;
  getHoverHandlers: ReturnType<typeof usePointerFollowHover>["getHoverHandlers"];
  titleClassName: string;
}) {
  const handlers = card.hoverLabel ? getHoverHandlers(card.id) : undefined;
  const body = (
    <article className="work-case-study-card__feature">
      <WorkCardMedia card={card} eager={eager} />
      <div className="work-case-study-card__copy">
        <p className="work-case-study-card__type text-heading-5 text-text-muted">{card.typeLabel}</p>
        <h3 className={`work-case-study-card__title text-text-primary ${titleClassName}`}>{card.title}</h3>
      </div>
    </article>
  );

  if (!card.href) {
    return (
      <div className="work-case-study-card" {...handlers}>
        {body}
      </div>
    );
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
  const { hover, getHoverHandlers } = usePointerFollowHover();
  const hoverLabel = hover
    ? WORK_GRID_CARDS.find((card) => card.id === hover.id)?.hoverLabel
    : undefined;

  return (
    <div className="editorial-work__projects">
      <div className="editorial-work__featured" role="list">
        {FEATURED_WORK_CARDS.map((card, index) => (
          <div key={card.id} role="listitem">
            <WorkProjectCard
              card={card}
              eager={index === 0 && Boolean(card.video)}
              getHoverHandlers={getHoverHandlers}
              titleClassName="editorial-featured-title"
            />
          </div>
        ))}
      </div>
      {COMPACT_WORK_CARDS.length > 0 ? (
        <div className="editorial-work__play" role="list">
          {COMPACT_WORK_CARDS.map((card) => (
            <div key={card.id} role="listitem">
              <WorkProjectCard
                card={card}
                getHoverHandlers={getHoverHandlers}
                titleClassName="editorial-play-title"
              />
            </div>
          ))}
        </div>
      ) : null}
      <PointerFollowLabel hover={hoverLabel ? hover : null} label={hoverLabel ?? ""} />
    </div>
  );
}
