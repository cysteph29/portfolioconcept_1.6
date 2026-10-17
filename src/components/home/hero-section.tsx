import Image from "next/image";
import type { ReactNode } from "react";

import { ReviewLink } from "@/components/navigation/review-link";

export const HOME_HERO_HEADLINE =
  "SF-based, AI-native Product Designer working across enterprise and consumer products.";

export const HOME_HERO_SUBHEAD =
  "I've worked across fintech, AI, and growth, often as the only designer. I like getting close to customers, figuring out what matters, and building things that work.";

type HeroSectionProps = {
  backgroundLayerContent?: ReactNode;
  headline?: string;
  id?: string;
  portraitAlt?: string;
  portraitSrc?: string;
  showActions?: boolean;
  showSubhead?: boolean;
  shouldAnimateHeadline?: boolean;
  withBackgroundLayer?: boolean;
  withViewportHeight?: boolean;
};

export function HeroSection({
  backgroundLayerContent,
  headline = HOME_HERO_HEADLINE,
  id = "hero",
  portraitAlt = "Portrait",
  portraitSrc = "/assets/profilepic.png",
  showActions = true,
  showSubhead = true,
  shouldAnimateHeadline = true,
  withBackgroundLayer = false,
  withViewportHeight = true,
}: HeroSectionProps) {
  return (
    <section
      className={`home-section home-section--hero home-fold${
        withViewportHeight ? "" : " home-section--content-height"
      }`}
      data-smart-navbar-hero
      id={id}
    >
      {withBackgroundLayer || backgroundLayerContent ? (
        <div
          aria-hidden="true"
          className="home-fold__background-layer"
        >
          {backgroundLayerContent}
        </div>
      ) : null}
      <div className="home-fold__center">
        <Image
          alt={portraitAlt}
          className="home-fold__portrait"
          height={120}
          src={portraitSrc}
          width={120}
        />
        <h1
          className="home-fold__headline text-display text-text-primary"
          data-reveal-05={shouldAnimateHeadline || undefined}
        >
          {headline}
        </h1>
        {showSubhead ? (
          <p className="home-fold__subhead text-body-2 text-text-muted">{HOME_HERO_SUBHEAD}</p>
        ) : null}
        {showActions ? (
          <div className="home-fold__actions">
            <a className="home-action home-action--primary text-heading-5" href="#work">
              <span>See work</span>
              <span aria-hidden="true">↓</span>
            </a>
            <ReviewLink className="home-action home-action--secondary text-heading-5" href="/about">
              [Who am I]
            </ReviewLink>
          </div>
        ) : null}
      </div>
    </section>
  );
}
