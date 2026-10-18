"use client";

import type { Icon } from "@phosphor-icons/react";
import { GithubLogo, LinkedinLogo, MediumLogo, XLogo } from "@phosphor-icons/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { MotionValue } from "motion/react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { type CSSProperties, type ReactNode, type Ref, useEffect, useLayoutEffect, useRef, useState } from "react";

import { FooterGridCanvas } from "./footer-grid-canvas";
import { PianoKeyboard } from "./piano-keyboard";
import { textReveal05 } from "./text-reveal-05";

const MARQUEE_ROW_COUNT = 4;
const MARQUEE_ROW_COUNT_MOBILE = 6;
const MARQUEE_PHRASE = "→ ←";
const MOBILE_BREAKPOINT_QUERY = "(max-width: 767px)";
const MARQUEE_PHRASE_REPETITIONS = 15;
const CONTACT_MARQUEE_TRAVEL_PX = 300;
const CONTACT_MARQUEE_REST_OFFSETS_PX = [-300, 260, -160, 340, -260, 300];
const CONTACT_MARQUEE_SPRING = { stiffness: 400, damping: 40 } as const;

type MarqueeDirection = "left" | "right";
type MarqueeRow = {
  direction: MarqueeDirection;
  restOffset: number;
  text: string;
};

type FooterLayout = {
  height: number;
  reveal: boolean;
};

type ContactFooterVariant = "editorial" | "legacy";

function buildMarqueeRows(count: number): MarqueeRow[] {
  return Array.from({ length: count }, (_, index) => ({
    direction: index % 2 === 0 ? "right" : "left",
    restOffset: CONTACT_MARQUEE_REST_OFFSETS_PX[index] ?? 0,
    text: Array.from({ length: MARQUEE_PHRASE_REPETITIONS }, () => MARQUEE_PHRASE).join(" "),
  }));
}

const socialLinks = [
  { label: "LINKEDIN", href: "https://www.linkedin.com/in/cyril-stephen", Icon: LinkedinLogo },
  { label: "TWITTER/X", href: "https://x.com/cyril_design", Icon: XLogo },
  { label: "MEDIUM", href: "https://medium.com/@cyril_design", Icon: MediumLogo },
  { label: "GITHUB", href: "https://github.com/cysteph29", Icon: GithubLogo },
] as const satisfies readonly { label: string; href: string; Icon: Icon }[];

const availabilityStatement =
  "I'm Currently Open For Product Design, Design Engineer & Related Roles Anywhere Within The U.S.";

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
  const sweepStart =
    direction === "right"
      ? restOffset - CONTACT_MARQUEE_TRAVEL_PX
      : restOffset + CONTACT_MARQUEE_TRAVEL_PX;
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

function scrollContactTarget(reveal: boolean) {
  if (window.location.hash !== "#contact") {
    return;
  }

  document.getElementById("contact")?.scrollIntoView({
    block: reveal ? "end" : "start",
    inline: "nearest",
    behavior: "instant",
  });
}

function useFooterRevealLayout(reveal: boolean) {
  const footerRef = useRef<HTMLElement>(null);
  const [layout, setLayout] = useState<FooterLayout>({ height: 0, reveal: false });
  const revealActive = layout.reveal;
  const spaceStyle = revealActive
    ? ({ "--footer-reveal-height": `${layout.height}px` } as CSSProperties)
    : undefined;

  useLayoutEffect(() => {
    const footer = footerRef.current;

    if (!footer) {
      return;
    }

    let frame = 0;

    const apply = () => {
      frame = 0;
      const footerHeight = footer.offsetHeight;
      const nav = document.querySelector<HTMLElement>(".top-nav-surface");
      const navHeight = nav?.getBoundingClientRect().height ?? 0;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const fits = reveal && footerHeight > 0 && footerHeight <= viewportHeight - navHeight + 0.5;

      setLayout((current) => {
        if (current.reveal === fits && Math.abs(current.height - footerHeight) < 1) {
          return current;
        }

        return { reveal: fits, height: footerHeight };
      });
    };

    const schedule = () => {
      if (frame !== 0) {
        return;
      }

      frame = window.requestAnimationFrame(apply);
    };

    apply();

    const observer = new ResizeObserver(schedule);
    observer.observe(footer);
    const nav = document.querySelector<HTMLElement>(".top-nav-surface");

    if (nav) {
      observer.observe(nav);
    }

    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }

      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
    };
  }, [reveal]);

  useLayoutEffect(() => {
    scrollContactTarget(revealActive);
  }, [revealActive]);

  useEffect(() => {
    ScrollTrigger.refresh();
  }, [revealActive, layout.height]);

  useEffect(() => {
    const footer = footerRef.current;

    if (!footer || !revealActive) {
      return;
    }

    const uncoverFocusedLink = (event: FocusEvent) => {
      const focused = event.target;

      if (!(focused instanceof HTMLElement) || !footer.contains(focused)) {
        return;
      }

      const main = document.querySelector("main");

      if (!main) {
        return;
      }

      const overlap = main.getBoundingClientRect().bottom - focused.getBoundingClientRect().top;

      if (overlap > 1) {
        window.scrollTo({ top: window.scrollY + overlap, behavior: "instant" });
      }
    };

    footer.addEventListener("focusin", uncoverFocusedLink);

    return () => {
      footer.removeEventListener("focusin", uncoverFocusedLink);
    };
  }, [revealActive]);

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

  return { footerRef, revealActive, spaceStyle };
}

function FooterRevealSpace({
  revealActive,
  spaceRef,
  spaceStyle,
  children,
}: {
  revealActive: boolean;
  spaceRef?: Ref<HTMLDivElement>;
  spaceStyle?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      className="footer-reveal-space"
      data-reveal={revealActive ? "active" : undefined}
      id="contact"
      ref={spaceRef}
      style={spaceStyle}
    >
      {children}
    </div>
  );
}

function ContactDetails() {
  return (
    <>
      <p className="contact-footer__email text-heading-2">cyrilstephenhere@gmail.com</p>
      <nav
        className="contact-footer__social-links"
        aria-label="Social links"
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          alignItems: "center",
          gap: "1.5rem",
          marginTop: "1.75rem",
        }}
      >
        {socialLinks.map((link) => (
          <a
            aria-label={link.label}
            className="contact-footer__social-link"
            href={link.href}
            key={link.href}
            rel="noopener noreferrer"
            target="_blank"
          >
            <link.Icon aria-hidden size={28} weight="regular" />
          </a>
        ))}
      </nav>
    </>
  );
}

function AvailabilityHeading() {
  return (
    <h2
      className="contact-footer__heading text-display"
      data-reveal-05
      data-scroll=""
      data-scroll-trigger="#contact"
      id="contact-footer-heading"
    >
      {availabilityStatement}
    </h2>
  );
}

function EditorialContactFooter({ reveal }: { reveal: boolean }) {
  const { footerRef, revealActive, spaceStyle } = useFooterRevealLayout(reveal);

  return (
    <FooterRevealSpace revealActive={revealActive} spaceStyle={spaceStyle}>
      <footer className="site-contact-footer site-contact-footer--editorial" ref={footerRef}>
        <div className="contact-footer__composition">
          <AvailabilityHeading />
          <div className="contact-footer__contact">
            <ContactDetails />
          </div>
        </div>
        <PianoKeyboard />
      </footer>
    </FooterRevealSpace>
  );
}

function LegacyContactFooter({ reveal }: { reveal: boolean }) {
  const spaceRef = useRef<HTMLDivElement>(null);
  const { footerRef, revealActive, spaceStyle } = useFooterRevealLayout(reveal);
  const [marqueeRowCount, setMarqueeRowCount] = useState(MARQUEE_ROW_COUNT);
  const { scrollYProgress } = useScroll({
    target: spaceRef,
    offset: ["start end", "end end"],
  });
  const smoothProgress = useSpring(scrollYProgress, CONTACT_MARQUEE_SPRING);
  const marqueeRows = buildMarqueeRows(marqueeRowCount);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const updateMarqueeRowCount = () => {
      setMarqueeRowCount(mediaQuery.matches ? MARQUEE_ROW_COUNT_MOBILE : MARQUEE_ROW_COUNT);
    };

    updateMarqueeRowCount();
    mediaQuery.addEventListener("change", updateMarqueeRowCount);

    return () => {
      mediaQuery.removeEventListener("change", updateMarqueeRowCount);
    };
  }, []);

  return (
    <FooterRevealSpace revealActive={revealActive} spaceRef={spaceRef} spaceStyle={spaceStyle}>
      <footer className="site-contact-footer" ref={footerRef}>
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

          <div className="contact-footer__surface-content">
            <AvailabilityHeading />
            <div className="contact-footer__mark text-heading-3" aria-hidden="true">
              \\
            </div>
            <ContactDetails />
          </div>
        </section>

        <div className="contact-footer__bottom-strip" style={{ justifyContent: "center" }}>
          <p className="contact-footer__copyright text-body-2">Vibe coded website | All rights reserved</p>
        </div>
      </footer>
    </FooterRevealSpace>
  );
}

export function ContactFooter({
  reveal = false,
  variant = "legacy",
}: {
  reveal?: boolean;
  variant?: ContactFooterVariant;
}) {
  if (variant === "editorial") {
    return <EditorialContactFooter reveal={reveal} />;
  }

  return <LegacyContactFooter reveal={reveal} />;
}
