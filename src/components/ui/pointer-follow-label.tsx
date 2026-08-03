"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type PointerEvent, useState } from "react";
import { createPortal } from "react-dom";

const HOVER_OFFSET_X_PX = 8;

export type PointerFollowHover = {
  id: string;
  x: number;
  y: number;
} | null;

export function usePointerFollowHover() {
  const [hover, setHover] = useState<PointerFollowHover>(null);

  const updateHover = (event: PointerEvent<HTMLElement>, id: string) => {
    if (event.pointerType !== "mouse") {
      return;
    }

    setHover({
      id,
      x: event.clientX + HOVER_OFFSET_X_PX,
      y: event.clientY,
    });
  };

  const getHoverHandlers = (id: string) => ({
    onPointerEnter: (event: PointerEvent<HTMLElement>) => {
      updateHover(event, id);
    },
    onPointerLeave: () => {
      setHover(null);
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      updateHover(event, id);
    },
  });

  return { hover, getHoverHandlers };
}

export function PointerFollowLabel({
  hover,
  label,
}: {
  hover: PointerFollowHover;
  label: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {hover ? (
        <motion.span
          key="pointer-follow-label"
          aria-hidden="true"
          className="work-case-study-card__hover"
          initial={false}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.12, ease: [0.16, 1, 0.3, 1] },
          }}
          style={{ left: hover.x, top: hover.y }}
        >
          <motion.span
            className="work-case-study-card__hover-square"
            initial={{ opacity: 0 }}
            animate={
              shouldReduceMotion
                ? { opacity: 1 }
                : { opacity: [0, 1, 0, 1, 0, 1, 0, 1] }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0.14, ease: [0.16, 1, 0.3, 1] }
                : {
                    duration: 0.38,
                    times: [0, 0.1, 0.22, 0.36, 0.48, 0.62, 0.74, 1],
                    ease: "linear",
                  }
            }
          />
          <span className="work-case-study-card__hover-label">{label}</span>
        </motion.span>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
