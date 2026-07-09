"use client";

import type { MotionValue } from "motion/react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect, useRef } from "react";

import { FooterGridCanvas } from "./footer-grid-canvas";
import { textReveal05 } from "./text-reveal-05";

const MARQUEE_ROW_COUNT = 4;
const MARQUEE_PHRASE = "→ REACH ME ←";
// Each strip overflows the viewport on both sides by far more than
// (TRAVEL + largest rest offset), so no edge is exposed at any scroll position.
const MARQUEE_PHRASE_REPETITIONS = 15;

// Horizontal sweep distance each row covers before settling at its rest offset.
const CONTACT_MARQUEE_TRAVEL_PX = 300;

// Per-row resting horizontal offsets (px). Large, clearly distinct magnitudes so the
// rows are obviously staggered at rest and the repeated text never lines up. Tune freely.
const CONTACT_MARQUEE_REST_OFFSETS_PX = [-300, 260, -160, 340];

// Smoothing spring applied to scroll progress before it drives the transforms.
// Tuned responsive (high stiffness, near-critical damping) so output tracks the scroll
// input closely with minimal lag, and only eases softly to a stop when the scroll input
// itself halts at the bottom. Raise stiffness / lower damping for an even snappier feel.
const CONTACT_MARQUEE_SPRING = { stiffness: 400, damping: 40 } as const;

type MarqueeDirection = "left" | "right";
type MarqueeRow = {
  direction: MarqueeDirection;
  restOffset: number;
  text: string;
};

const marqueeRows: MarqueeRow[] = Array.from({ length: MARQUEE_ROW_COUNT }, (_, index) => ({
  direction: index % 2 === 0 ? "right" : "left",
  restOffset: CONTACT_MARQUEE_REST_OFFSETS_PX[index] ?? 0,
  text: Array.from({ length: MARQUEE_PHRASE_REPETITIONS }, () => MARQUEE_PHRASE).join(" "),
}));

const socialLinks = [
  { label: "LINKEDIN", href: "https://www.linkedin.com/in/cyril-stephen" },
  { label: "TWITTER/X", href: "https://x.com/cyril_design" },
  { label: "MEDIUM", href: "https://medium.com/@cyril_design" },
];

function ContactMarqueeRow({
  direction,
  progress,
  restOffset,
  text,
}: {
  direction: MarqueeDirection;
  progress: MotionValue<number>;
  restOffset: number;
  text: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  // Sweep relative to this row's rest offset: right rows enter from the left,
  // left rows enter from the right, and both settle at their own rest offset.
  const sweepStart =
    direction === "right"
      ? restOffset - CONTACT_MARQUEE_TRAVEL_PX
      : restOffset + CONTACT_MARQUEE_TRAVEL_PX;
  // Linear mapping (no eased dead-zone near rest) so the rows respond the instant
  // scrolling begins in either direction; the soft stop comes only from the spring.
  const x = useTransform(progress, [0, 1], [sweepStart, restOffset]);

  return (
    <div className="contact-footer__marquee-row" data-direction={direction}>
      <motion.div
        className="contact-footer__marquee-strip contact-footer__marquee-strip--regular font-normal"
        style={{ x: shouldReduceMotion ? restOffset : x }}
      >
        {text}
      </motion.div>
    </div>
  );
}

export function ContactFooter() {
  const footerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "start start"],
  });
  const smoothProgress = useSpring(scrollYProgress, CONTACT_MARQUEE_SPRING);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const init = () => {
      if (cancelled || !footerRef.current) {
        return;
      }

      cleanup?.();
      cleanup = textReveal05(footerRef.current);
    };

    document.fonts.ready.then(init);

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <footer className="site-contact-footer" id="contact" ref={footerRef}>
      <div className="contact-footer__marquee" aria-hidden="true">
        {marqueeRows.map((row, index) => (
          <ContactMarqueeRow
            direction={row.direction}
            key={`${row.direction}-${index}`}
            progress={smoothProgress}
            restOffset={row.restOffset}
            text={row.text}
          />
        ))}
      </div>

      <section className="contact-footer__surface" aria-labelledby="contact-footer-heading">
        <FooterGridCanvas />

        <span className="contact-footer__corner contact-footer__corner--top-left" />
        <span className="contact-footer__corner contact-footer__corner--top-right" />
        <span className="contact-footer__corner contact-footer__corner--bottom-left" />
        <span className="contact-footer__corner contact-footer__corner--bottom-right" />

        <div className="contact-footer__surface-content">
          <div className="contact-footer__image-placeholder" aria-hidden="true">
            <Image
              src="/assets/contact-mosaic.png"
              alt=""
              width={120}
              height={120}
              className="contact-footer__mosaic-image"
            />
          </div>
          <h2
            className="contact-footer__heading text-display-2"
            data-reveal-05
            data-scroll=""
            id="contact-footer-heading"
          >
            I&apos;m Currently Open For Product Design, Design Engineer &amp; Related Roles Anywhere
            Within The U.S.
          </h2>
          <div className="contact-footer__mark text-display-4" aria-hidden="true">
            \\
          </div>
          <p className="contact-footer__email text-display-3">cyrilstephenhere@gmail.com</p>
        </div>
      </section>

      <div className="contact-footer__bottom-strip">
        <p className="contact-footer__copyright text-body-2">Vibe coded website | All rights reserved</p>
        <nav className="contact-footer__links" aria-label="Social links">
          {socialLinks.map((link) => (
            <a
              className="text-label-1"
              href={link.href}
              key={link.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
