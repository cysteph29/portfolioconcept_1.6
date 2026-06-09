"use client";

import { usePathname } from "next/navigation";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import { useTransitionContext } from "@/components/navigation/transition-context";
import { EXPERIENCE_ENTRIES } from "@/config/experience";

const EXPERIENCE_PATHNAME = "/experience";
const REVEALED_CLASS_NAME = "experience-card--revealed";
const CARD_SEQUENCE_BASE_DELAY_MS = 220;
const CARD_SEQUENCE_STAGGER_MS = 70;
const DEFAULT_REVEAL_TRIGGER_OFFSET_PX = 16;

function isHTMLElement(element: HTMLElement | null): element is HTMLElement {
  return element !== null;
}

function getScrollRoot(cards: HTMLElement[]) {
  return (cards[0]?.closest(".experience-fold__scroll") as HTMLElement | null) ?? null;
}

function getRevealTriggerOffset(scrollRoot: HTMLElement) {
  const configuredOffset = Number.parseFloat(
    window.getComputedStyle(scrollRoot).getPropertyValue("--motion-experience-reveal-trigger-offset"),
  );
  return Number.isFinite(configuredOffset) ? configuredOffset : DEFAULT_REVEAL_TRIGGER_OFFSET_PX;
}

function revealVisibleCards(
  cards: HTMLElement[],
  scrollRoot: HTMLElement,
  revealOrderByCard: number[],
  nextRevealOrderRef: { current: number },
) {
  const rootRect = scrollRoot.getBoundingClientRect();
  const revealBoundary = rootRect.bottom + getRevealTriggerOffset(scrollRoot);

  cards.forEach((card, index) => {
    const cardRect = card.getBoundingClientRect();
    const isVisible = cardRect.top <= revealBoundary && cardRect.bottom >= rootRect.top;

    if (!isVisible || card.classList.contains(REVEALED_CLASS_NAME)) {
      return;
    }

    if (revealOrderByCard[index] === -1) {
      revealOrderByCard[index] = nextRevealOrderRef.current;
      nextRevealOrderRef.current += 1;
    }

    const revealDelayMs = CARD_SEQUENCE_BASE_DELAY_MS + revealOrderByCard[index] * CARD_SEQUENCE_STAGGER_MS;
    card.style.setProperty("--experience-reveal-delay", `${revealDelayMs}ms`);
    card.classList.add(REVEALED_CLASS_NAME);
  });
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  return prefersReducedMotion;
}

type ExperienceCardsProps = {
  isTransitionOverlay?: boolean;
};

type ExperienceCardColumn = "left" | "right";

type ExperienceCardItem = {
  entry: (typeof EXPERIENCE_ENTRIES)[number];
  originalIndex: number;
  side: ExperienceCardColumn;
};

export function ExperienceCards({ isTransitionOverlay = false }: ExperienceCardsProps) {
  const pathname = usePathname();
  const { isTransitioning } = useTransitionContext();
  const prefersReducedMotion = usePrefersReducedMotion();
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const revealOrderByCardRef = useRef<number[]>([]);
  const nextRevealOrderRef = useRef(0);
  const isSettledExperience = pathname === EXPERIENCE_PATHNAME && !isTransitioning;
  const cardsByColumn = EXPERIENCE_ENTRIES.reduce<{
    left: ExperienceCardItem[];
    right: ExperienceCardItem[];
  }>(
    (columns, entry, originalIndex) => {
      const side: ExperienceCardColumn = originalIndex % 2 === 0 ? "left" : "right";
      const card = { entry, originalIndex, side };
      columns[side].push(card);
      return columns;
    },
    { left: [], right: [] },
  );

  useEffect(() => {
    const cards = cardRefs.current.filter(isHTMLElement);

    revealOrderByCardRef.current = cards.map(() => -1);
    nextRevealOrderRef.current = 0;

    if (prefersReducedMotion || isTransitionOverlay) {
      cards.forEach((card) => {
        card.style.removeProperty("--experience-reveal-delay");
        card.classList.add(REVEALED_CLASS_NAME);
      });
      return;
    }

    cards.forEach((card) => {
      card.style.removeProperty("--experience-reveal-delay");
      card.classList.remove(REVEALED_CLASS_NAME);
    });

    if (!isSettledExperience) {
      return;
    }

    const scrollRoot = getScrollRoot(cards);
    if (!scrollRoot) {
      return;
    }

    const runReveal = () => {
      revealVisibleCards(cards, scrollRoot, revealOrderByCardRef.current, nextRevealOrderRef);
    };

    runReveal();
    scrollRoot.addEventListener("scroll", runReveal, { passive: true });
    window.addEventListener("resize", runReveal);

    return () => {
      scrollRoot.removeEventListener("scroll", runReveal);
      window.removeEventListener("resize", runReveal);
    };
  }, [isSettledExperience, isTransitionOverlay, prefersReducedMotion]);

  const renderCard = ({ entry, originalIndex, side }: ExperienceCardItem) => {
    return (
      <article
        key={`${entry.logo}-${entry.title}`}
        ref={(element) => {
          cardRefs.current[originalIndex] = element;
        }}
        style={
          {
            "--experience-card-order": originalIndex,
          } as CSSProperties
        }
        className={[
          "experience-card",
          side === "left" ? "experience-card--left" : "experience-card--right",
          isTransitionOverlay || prefersReducedMotion ? REVEALED_CLASS_NAME : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          aria-label={`${entry.title} mosaic-framed tile placeholder`}
          className="experience-card__tile"
          role="img"
        >
          <div aria-hidden="true" className="experience-card__logo-placeholder">
            {entry.logo}
          </div>
        </div>
        <div className="experience-card__body">
          <h2 className="experience-card__title font-pixel text-headline text-text-primary">
            {entry.title}
          </h2>
          <p className="experience-card__description font-sans text-subhead text-text-muted">
            {entry.description}
          </p>
        </div>
      </article>
    );
  };

  return (
    <div className="experience-card-list">
      <div className="experience-card-column experience-card-column--left">
        {cardsByColumn.left.map(renderCard)}
      </div>
      <div className="experience-card-column experience-card-column--right">
        {cardsByColumn.right.map(renderCard)}
      </div>
    </div>
  );
}
