import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const DEFAULT_HEADLINE =
  "Product designer & builder based out of the bay area.";

const DEFAULT_SUBHEAD =
  "Previously owned design for an enterprise FinTech platform used by 100+ companies globally. I'm currently open to Product/UX Design opportunities.";

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
  headline = DEFAULT_HEADLINE,
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
          className="home-fold__headline text-display-2 text-text-primary"
          data-reveal-05={shouldAnimateHeadline || undefined}
        >
          {headline}
        </h1>
        {showSubhead ? (
          <p className="home-fold__subhead text-body-2 text-text-muted">{DEFAULT_SUBHEAD}</p>
        ) : null}
        {showActions ? (
          <div className="home-fold__actions">
            <a className="home-action home-action--primary text-label-1" href="#work">
              <span>See work</span>
              <span aria-hidden="true">↓</span>
            </a>
            <Link className="home-action home-action--secondary text-label-1" href="/about">
              [Who am I]
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
