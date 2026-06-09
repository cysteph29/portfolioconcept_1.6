"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

import { getRouteFold } from "@/components/folds/route-folds";
import { useTransitionContext } from "@/components/navigation/transition-context";
import { TOP_LEVEL_SECTIONS, getSectionIndexFromPathname } from "@/config/sections";

type TravelValues = {
  outgoingX: number | string;
  outgoingY: number | string;
  incomingX: number | string;
  incomingY: number | string;
};

function getTravelValues(axis: "x" | "y", direction: 1 | -1): TravelValues {
  if (axis === "x") {
    return {
      outgoingX: `${-direction * 120}vw`,
      outgoingY: 0,
      incomingX: `${direction * 120}vw`,
      incomingY: 0,
    };
  }

  return {
    outgoingX: 0,
    outgoingY: `${-direction * 120}vh`,
    incomingX: 0,
    incomingY: `${direction * 120}vh`,
  };
}

export function TransitionOverlay() {
  const { activeTransition } = useTransitionContext();

  const motionConfig = useMemo(() => {
    if (!activeTransition) {
      return null;
    }

    const travel = getTravelValues(activeTransition.axis, activeTransition.direction);
    return {
      travel,
      durationSeconds: activeTransition.durationMs / 1000,
      times: [0, activeTransition.shrinkPhaseEnd, activeTransition.travelPhaseEnd, 1] as [
        number,
        number,
        number,
        number,
      ],
    };
  }, [activeTransition]);

  if (!activeTransition || !motionConfig) {
    return null;
  }

  const isHorizontalSkipTransition =
    activeTransition.axis === "x" && activeTransition.sectionsCrossed > 1;

  return (
    <motion.div
      key={`${activeTransition.from}->${activeTransition.to}`}
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden bg-canvas"
      initial={false}
      animate={{ opacity: 1 }}
    >
      {isHorizontalSkipTransition ? (
        <HorizontalSkipStrip />
      ) : (
        <>
          <motion.div
            className="absolute inset-0 origin-center"
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{
              x: [0, 0, motionConfig.travel.outgoingX, motionConfig.travel.outgoingX],
              y: [0, 0, motionConfig.travel.outgoingY, motionConfig.travel.outgoingY],
              scale: [
                1,
                activeTransition.miniatureScale,
                activeTransition.miniatureScale,
                activeTransition.miniatureScale,
              ],
              opacity: [1, 1, 1, 1],
            }}
            transition={{
              duration: motionConfig.durationSeconds,
              times: motionConfig.times,
              ease: activeTransition.easing,
            }}
          >
            {getRouteFold(activeTransition.from, { isTransitionOverlay: true })}
          </motion.div>

          <motion.div
            className="absolute inset-0 origin-center"
            initial={{
              x: motionConfig.travel.incomingX,
              y: motionConfig.travel.incomingY,
              scale: activeTransition.miniatureScale,
              opacity: 0,
            }}
            animate={{
              x: [motionConfig.travel.incomingX, motionConfig.travel.incomingX, 0, 0],
              y: [motionConfig.travel.incomingY, motionConfig.travel.incomingY, 0, 0],
              scale: [
                activeTransition.miniatureScale,
                activeTransition.miniatureScale,
                activeTransition.miniatureScale,
                1,
              ],
              opacity: [0, 0, 1, 1],
            }}
            transition={{
              duration: motionConfig.durationSeconds,
              times: motionConfig.times,
              ease: activeTransition.easing,
            }}
          >
            {getRouteFold(activeTransition.to, { isTransitionOverlay: true })}
          </motion.div>
        </>
      )}
    </motion.div>
  );

  function HorizontalSkipStrip() {
    if (!activeTransition || !motionConfig) {
      return null;
    }

    const fromSectionIndex = getSectionIndexFromPathname(activeTransition.from);
    const toSectionIndex = getSectionIndexFromPathname(activeTransition.to);
    const stripStart = Math.min(fromSectionIndex, toSectionIndex);
    const stripEnd = Math.max(fromSectionIndex, toSectionIndex);
    const stripPaths = TOP_LEVEL_SECTIONS.slice(stripStart, stripEnd + 1).map(
      (section) => section.href,
    );
    const fromSlot = fromSectionIndex - stripStart;
    const toSlot = toSectionIndex - stripStart;
    const populatedStripPaths = [...stripPaths];

    populatedStripPaths[fromSlot] = activeTransition.from;
    populatedStripPaths[toSlot] = activeTransition.to;

    return (
      <motion.div
        className="absolute inset-0 flex"
        initial={{ x: `${-fromSlot * 100}vw` }}
        animate={{
          x: [
            `${-fromSlot * 100}vw`,
            `${-fromSlot * 100}vw`,
            `${-toSlot * 100}vw`,
            `${-toSlot * 100}vw`,
          ],
        }}
        transition={{
          duration: motionConfig.durationSeconds,
          times: motionConfig.times,
          ease: activeTransition.easing,
        }}
      >
        {populatedStripPaths.map((path, slotIndex) => {
          const role =
            slotIndex === fromSlot
              ? "from"
              : slotIndex === toSlot
                ? "to"
                : "pass-through";

          const scaleValues =
            role === "from"
              ? [1, activeTransition.miniatureScale, activeTransition.miniatureScale, activeTransition.miniatureScale]
              : role === "to"
                ? [
                    activeTransition.miniatureScale,
                    activeTransition.miniatureScale,
                    activeTransition.miniatureScale,
                    1,
                  ]
                : [
                    activeTransition.miniatureScale,
                    activeTransition.miniatureScale,
                    activeTransition.miniatureScale,
                    activeTransition.miniatureScale,
                  ];

          return (
            <div key={`${path}-${slotIndex}`} className="h-full w-screen shrink-0">
              <motion.div
                className="h-full w-full origin-center"
                initial={{ scale: scaleValues[0] }}
                animate={{ scale: scaleValues }}
                transition={{
                  duration: motionConfig.durationSeconds,
                  times: motionConfig.times,
                  ease: activeTransition.easing,
                }}
              >
                {getRouteFold(path, { isTransitionOverlay: true })}
              </motion.div>
            </div>
          );
        })}
      </motion.div>
    );
  }
}
