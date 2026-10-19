import styles from "./capability-forms.module.css";

const SIZE = 300;
const CENTER = SIZE / 2;
const RADIUS = 118;
const STRIP_COUNT = 11;
const ACCENT_STRIP = 5;
const STRIP_HEIGHT = (RADIUS * 2) / STRIP_COUNT;
const STAGGER_MS = 34;

type StripPose = {
  opacity: number;
  scale: number;
  x: number;
};

type FormState = StripPose[];

function halfChord(y: number) {
  return Math.sqrt(Math.max(0, RADIUS ** 2 - (y - CENTER) ** 2));
}

function slicePath(index: number) {
  const top = CENTER - RADIUS + index * STRIP_HEIGHT;
  const bottom = top + STRIP_HEIGHT;
  const topHalf = halfChord(top);
  const bottomHalf = halfChord(bottom);
  const r = RADIUS.toFixed(2);

  return [
    `M${(CENTER - topHalf).toFixed(2)} ${top.toFixed(2)}`,
    `L${(CENTER + topHalf).toFixed(2)} ${top.toFixed(2)}`,
    `A${r} ${r} 0 0 1 ${(CENTER + bottomHalf).toFixed(2)} ${bottom.toFixed(2)}`,
    `L${(CENTER - bottomHalf).toFixed(2)} ${bottom.toFixed(2)}`,
    `A${r} ${r} 0 0 1 ${(CENTER - topHalf).toFixed(2)} ${top.toFixed(2)}`,
    "Z",
  ].join(" ");
}

const SLICES = Array.from({ length: STRIP_COUNT }, (_, index) => slicePath(index));

const FAULT_OFFSETS = [-6, -12, -20, -30, -42, 0, 52, 38, 26, 16, 8];
const ECHO_OFFSET = 34;
const LIME_POSE: StripPose = { opacity: 1, scale: 0.28, x: 0 };

function at(x: number, scale: number, opacity = 1): StripPose {
  return { opacity, scale, x };
}

// Order matches the capabilities. The lime seam keeps the same pose in every state.
const FORM_STATES: FormState[] = [
  FAULT_OFFSETS.map((x, index) => ({ opacity: 1, scale: index === ACCENT_STRIP ? 0.28 : 0.86, x })),
  FAULT_OFFSETS.map((_, index) => {
    const isEcho = index !== ACCENT_STRIP && index % 2 === 0;

    return {
      opacity: isEcho ? 0.32 : 1,
      scale: index === ACCENT_STRIP ? 0.28 : 0.42,
      x: index === ACCENT_STRIP ? 0 : isEcho ? -ECHO_OFFSET : ECHO_OFFSET,
    };
  }),
  // Two registers: a locked block above the seam, a measured stagger below it.
  [
    at(-26, 0.9),
    at(-26, 0.9),
    at(-26, 0.9),
    at(-26, 0.9),
    at(-26, 0.9),
    LIME_POSE,
    at(14, 0.56),
    at(36, 0.56),
    at(14, 0.56),
    at(36, 0.56),
    at(14, 0.56),
  ],
  // Edges drift outward and dim; everything tightens toward the seam.
  [
    at(-52, 0.6, 0.4),
    at(-36, 0.6, 0.58),
    at(-22, 0.6, 0.76),
    at(-12, 0.6, 0.9),
    at(-4, 0.6, 1),
    LIME_POSE,
    at(6, 0.6, 1),
    at(14, 0.6, 0.9),
    at(24, 0.6, 0.76),
    at(38, 0.6, 0.58),
    at(54, 0.6, 0.4),
  ],
  // The slices close into one disc, with the seam left as a fine cut.
  Array.from({ length: STRIP_COUNT }, (_, index) => (index === ACCENT_STRIP ? LIME_POSE : at(0, 0.94))),
];

export const FORM_STATE_COUNT = FORM_STATES.length;

export function CapabilityForms({ state }: { state: number }) {
  const poses = FORM_STATES[state % FORM_STATE_COUNT];

  return (
    <svg className={styles.forms} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      {SLICES.map((d, index) => {
        const pose = poses[index];

        return (
          <g
            className={styles.strip}
            key={index}
            style={{
              opacity: pose.opacity,
              transform: `translateX(${pose.x}px)`,
              transitionDelay: `${Math.abs(index - ACCENT_STRIP) * STAGGER_MS}ms`,
            }}
          >
            <path
              className={index === ACCENT_STRIP ? styles.accent : styles.slice}
              d={d}
              style={{
                transform: `scaleY(${pose.scale})`,
                transitionDelay: `${Math.abs(index - ACCENT_STRIP) * STAGGER_MS}ms`,
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}
