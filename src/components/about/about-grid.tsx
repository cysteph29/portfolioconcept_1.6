"use client";

import Image from "next/image";
import { type CSSProperties, type MouseEvent, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";

import {
  ABOUT_GRID_CELLS,
  ABOUT_GRID_COLUMNS,
  ABOUT_GRID_GROUP_VISIBLE_MS,
  ABOUT_GRID_HOVER_ICON_OPACITY,
  ABOUT_GRID_HOVER_TRANSITION_MS,
  ABOUT_GRID_ICON_FADE_MS,
  ABOUT_GRID_RESTING_ICON_OPACITY,
  ABOUT_GRID_ROWS,
  ABOUT_GRID_STAGGER_MS,
  ABOUT_GRID_TOOLTIP_OFFSET_PX,
  type AboutGridCell,
  type AboutGridIconCell,
  type AboutGridIconGroup,
  type AboutGridPhotoCell,
} from "@/config/about-grid.config";

type TooltipState = {
  cellId: string;
  caption: string;
  x: number;
  y: number;
};

function isIconCell(cell: AboutGridCell): cell is AboutGridIconCell {
  return cell.type === "icon";
}

function isPhotoCell(cell: AboutGridCell): cell is AboutGridPhotoCell {
  return cell.type === "photo";
}

function getNextGroup(group: AboutGridIconGroup): AboutGridIconGroup {
  return group === 1 ? 2 : 1;
}

const iconCells = ABOUT_GRID_CELLS.filter(isIconCell);
const photoCells = ABOUT_GRID_CELLS.filter(isPhotoCell);

const verticalLinePositions = Array.from({ length: ABOUT_GRID_COLUMNS + 1 }, (_, index) => {
  return (index / ABOUT_GRID_COLUMNS) * 100;
});

const horizontalLinePositions = Array.from({ length: ABOUT_GRID_ROWS + 1 }, (_, index) => {
  return (index / ABOUT_GRID_ROWS) * 100;
});

const iconOrderById = iconCells.reduce<Record<string, number>>((orders, cell) => {
  const groupOrder = iconCells.filter((iconCell) => iconCell.group === cell.group).findIndex((iconCell) => {
    return iconCell.id === cell.id;
  });
  orders[cell.id] = groupOrder;
  return orders;
}, {});

const iconCountByGroup = iconCells.reduce<Record<AboutGridIconGroup, number>>(
  (counts, cell) => {
    counts[cell.group] += 1;
    return counts;
  },
  { 1: 0, 2: 0 },
);

function getGroupExitDurationMs(group: AboutGridIconGroup) {
  return ABOUT_GRID_ICON_FADE_MS + Math.max(0, iconCountByGroup[group] - 1) * ABOUT_GRID_STAGGER_MS;
}

function getGridCellStyle(cell: AboutGridCell): CSSProperties {
  const colSpan = cell.type === "name" ? cell.colSpan : 1;

  return {
    gridColumn: `${cell.col} / span ${colSpan}`,
    gridRow: `${cell.row} / span 1`,
    position: "relative",
  };
}

function getGridStyle(): CSSProperties {
  return {
    "--about-grid-columns": ABOUT_GRID_COLUMNS,
    "--about-grid-rows": ABOUT_GRID_ROWS,
  } as CSSProperties;
}

function updateTooltipPosition(event: MouseEvent<HTMLElement>, caption: string, cellId: string) {
  return {
    cellId,
    caption,
    x: event.clientX + ABOUT_GRID_TOOLTIP_OFFSET_PX,
    y: event.clientY + ABOUT_GRID_TOOLTIP_OFFSET_PX,
  };
}

function renderIcon(cell: AboutGridIconCell) {
  return (
    <svg
      aria-hidden="true"
      className="about-grid-icon__svg"
      focusable="false"
      role="img"
      viewBox={cell.icon.viewBox}
    >
      {cell.icon.paths.map((path, index) => {
        return <path d={path.d} fill="currentColor" fillRule={path.fillRule} key={index} />;
      })}
    </svg>
  );
}

export function AboutGrid() {
  const [activeGroup, setActiveGroup] = useState<AboutGridIconGroup | null>(1);
  const [exitingGroup, setExitingGroup] = useState<AboutGridIconGroup | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const mobilePhotos = useMemo(() => {
    return photoCells.map((cell) => {
      return (
        <figure className="about-grid-mobile-photo" key={cell.id}>
          <Image alt={cell.imageAlt} fill sizes="(max-width: 800px) 45vw" src={cell.imageSrc} />
        </figure>
      );
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timerId: number | undefined;

    const scheduleCycle = (group: AboutGridIconGroup) => {
      timerId = window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        setTooltip(null);
        setExitingGroup(group);
        setActiveGroup(null);

        timerId = window.setTimeout(() => {
          if (cancelled) {
            return;
          }

          const nextGroup = getNextGroup(group);
          setExitingGroup(null);
          setActiveGroup(nextGroup);
          scheduleCycle(nextGroup);
        }, getGroupExitDurationMs(group));
      }, ABOUT_GRID_GROUP_VISIBLE_MS);
    };

    scheduleCycle(1);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, []);

  return (
    <section className="about-hero" aria-label="About Cyril" data-smart-navbar-hero>
      <div className="about-grid" style={getGridStyle()}>
        <svg aria-hidden="true" className="about-grid-lines" preserveAspectRatio="none">
          {verticalLinePositions.map((position) => {
            return (
              <line key={`v-${position}`} x1={`${position}%`} x2={`${position}%`} y1="0%" y2="100%" />
            );
          })}
          {horizontalLinePositions.map((position) => {
            return (
              <line key={`h-${position}`} x1="0%" x2="100%" y1={`${position}%`} y2={`${position}%`} />
            );
          })}
        </svg>
        {ABOUT_GRID_CELLS.map((cell) => {
          if (cell.type === "photo") {
            return (
              <figure
                className="about-grid-cell about-grid-cell--photo"
                key={cell.id}
                onMouseEnter={(event) => {
                  setTooltip(updateTooltipPosition(event, cell.caption, cell.id));
                }}
                onMouseLeave={() => {
                  setTooltip(null);
                }}
                onMouseMove={(event) => {
                  setTooltip(updateTooltipPosition(event, cell.caption, cell.id));
                }}
                style={getGridCellStyle(cell)}
              >
                <Image alt={cell.imageAlt} fill sizes="(min-width: 801px) 12vw, 45vw" src={cell.imageSrc} />
              </figure>
            );
          }

          if (cell.type === "name") {
            return (
              <div className="about-grid-cell about-grid-cell--name" key={cell.id} style={getGridCellStyle(cell)}>
                <p>{cell.text}</p>
              </div>
            );
          }

          const order = iconOrderById[cell.id] ?? 0;
          const isActive = activeGroup === cell.group;
          const isExiting = exitingGroup === cell.group;
          const canShowTooltip = isActive && !isExiting;
          const isHovered = canShowTooltip && tooltip?.cellId === cell.id;

          return (
            <div
              className="about-grid-cell about-grid-cell--icon"
              key={cell.id}
              onMouseEnter={(event) => {
                if (canShowTooltip) {
                  setTooltip(updateTooltipPosition(event, cell.caption, cell.id));
                }
              }}
              onMouseLeave={() => {
                setTooltip(null);
              }}
              onMouseMove={(event) => {
                if (canShowTooltip) {
                  setTooltip(updateTooltipPosition(event, cell.caption, cell.id));
                }
              }}
              style={getGridCellStyle(cell)}
            >
              <motion.div
                animate={{
                  opacity: isActive ? 1 : 0,
                  scale: isActive ? 1 : 0.88,
                }}
                className="about-grid-icon"
                initial={{ opacity: 0, scale: 0.88 }}
                transition={{
                  delay: (isActive || isExiting ? order * ABOUT_GRID_STAGGER_MS : 0) / 1000,
                  duration: ABOUT_GRID_ICON_FADE_MS / 1000,
                  ease: "easeOut",
                }}
              >
                <motion.div
                  animate={{
                    opacity: isHovered ? ABOUT_GRID_HOVER_ICON_OPACITY : ABOUT_GRID_RESTING_ICON_OPACITY,
                  }}
                  className="about-grid-icon__hover"
                  transition={{
                    duration: ABOUT_GRID_HOVER_TRANSITION_MS / 1000,
                    ease: "easeOut",
                  }}
                >
                  {renderIcon(cell)}
                </motion.div>
              </motion.div>
            </div>
          );
        })}
      </div>

      <div className="about-grid-mobile-photos" aria-label="About Cyril photos">
        {mobilePhotos}
      </div>

      {tooltip ? (
        <div className="about-grid-tooltip font-pixel" style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.caption}
        </div>
      ) : null}
    </section>
  );
}
