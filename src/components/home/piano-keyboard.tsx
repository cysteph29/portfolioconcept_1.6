"use client";

import { type CSSProperties, type RefObject, useEffect, useRef, useState } from "react";

import {
  buildPianoGlyphMask,
  loadPianoGlyphFont,
  measurePianoDotLayout,
  paintPianoDots,
  paintPianoGlyphs,
  type PianoPaletteId,
} from "@/components/home/piano-dot-matrix";

import "@/app/trial/trial.module.css";

const WHITE_PITCHES = ["C", "D", "E", "F", "G", "A", "B"] as const;
const BLACK_PITCH_AFTER: Partial<Record<(typeof WHITE_PITCHES)[number], string>> = {
  C: "Cs",
  D: "Ds",
  F: "Fs",
  G: "Gs",
  A: "As",
};
const FIRST_OCTAVE = 1;
const OCTAVE_COUNT = 18;

const ACTIVE_CLASS = "piano-keyboard__key--active";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const EXPOSE_START = 0.5;
const EXPOSE_STOP = 0.3;
const LOOP_REST_MS = 2200;

type WhiteKey = {
  id: string;
};

type BlackKey = {
  id: string;
  whiteIndex: number;
};

type PianoPhraseNote = {
  note: string;
  /** Milliseconds from the start of the phrase. */
  start: number;
  /** Milliseconds the key stays lit. */
  duration: number;
};

type PianoEvent = {
  time: number;
  note: string;
  pressed: boolean;
};

/**
 * Placeholder phrase for the centered keys around F9–F10.
 * That cluster stays on screen from a phone through desktop.
 * Times are milliseconds. A rest follows the last release before the loop repeats.
 */
const PIANO_PHRASE: readonly PianoPhraseNote[] = [
  { note: "C10", start: 0, duration: 560 },
  { note: "E10", start: 760, duration: 340 },
  { note: "G9", start: 1320, duration: 880 },

  { note: "A9", start: 2860, duration: 300 },
  { note: "B9", start: 3320, duration: 260 },
  { note: "C10", start: 3780, duration: 620 },

  { note: "G9", start: 4780, duration: 1360 },
  { note: "E10", start: 4900, duration: 640 },
  { note: "D10", start: 5720, duration: 480 },

  { note: "F10", start: 7420, duration: 280 },
  { note: "E10", start: 7860, duration: 240 },
  { note: "D10", start: 8260, duration: 420 },
  { note: "C10", start: 8860, duration: 680 },

  { note: "G9", start: 10120, duration: 1080 },
  { note: "C10", start: 10200, duration: 960 },
  { note: "E10", start: 10280, duration: 840 },

  { note: "As9", start: 11840, duration: 240 },
  { note: "Ds10", start: 12240, duration: 300 },
  { note: "E10", start: 12700, duration: 380 },
  { note: "C10", start: 13240, duration: 640 },
  { note: "A9", start: 13240, duration: 980 },
  { note: "G9", start: 14040, duration: 860 },
];

const PIANO_EVENTS: readonly PianoEvent[] = PIANO_PHRASE.flatMap((item) => [
  { time: item.start, note: item.note, pressed: true },
  { time: item.start + item.duration, note: item.note, pressed: false },
]).sort((a, b) => a.time - b.time || Number(a.pressed) - Number(b.pressed));

function createPianoKeys() {
  const white: WhiteKey[] = [];
  const black: BlackKey[] = [];

  for (let octave = FIRST_OCTAVE; octave < FIRST_OCTAVE + OCTAVE_COUNT; octave += 1) {
    for (const pitch of WHITE_PITCHES) {
      const whiteIndex = white.length;
      white.push({ id: `${pitch}${octave}` });

      const blackPitch = BLACK_PITCH_AFTER[pitch];

      if (blackPitch) {
        black.push({ id: `${blackPitch}${octave}`, whiteIndex });
      }
    }
  }

  return { white, black };
}

const PIANO_KEYS = createPianoKeys();

function exposedFraction(keyboard: HTMLElement) {
  const rect = keyboard.getBoundingClientRect();

  if (rect.height <= 0 || rect.width <= 0) {
    return 0;
  }

  const viewportHeight = window.innerHeight;
  const top = Math.max(rect.top, 0);
  const bottom = Math.min(rect.bottom, viewportHeight);
  let visible = bottom - top;

  if (visible <= 0) {
    return 0;
  }

  const main = document.querySelector("main");

  if (main) {
    const mainRect = main.getBoundingClientRect();
    const overlapsX = Math.min(rect.right, mainRect.right) - Math.max(rect.left, mainRect.left) > 0;

    if (overlapsX) {
      const overlapY = Math.min(bottom, mainRect.bottom) - Math.max(top, mainRect.top);

      if (overlapY > 0) {
        visible -= overlapY;
      }
    }
  }

  return Math.max(0, visible) / rect.height;
}

function usePianoPhrase(rootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current;

    if (!root || PIANO_EVENTS.length === 0) {
      return;
    }

    const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const keys = new Map<string, HTMLElement>();

    for (const element of root.querySelectorAll<HTMLElement>("[data-note]")) {
      const note = element.dataset.note;

      if (note) {
        keys.set(note, element);
      }
    }

    const held = new Map<string, number>();
    let generation = 0;
    let playing = false;
    let disposed = false;
    let frame = 0;
    let timer: number | undefined;

    const releaseAll = () => {
      for (const note of held.keys()) {
        keys.get(note)?.classList.remove(ACTIVE_CLASS);
      }

      held.clear();
    };

    const stop = () => {
      generation += 1;
      playing = false;
      window.clearTimeout(timer);
      releaseAll();
    };

    const setPressed = (note: string, pressed: boolean) => {
      const key = keys.get(note);

      if (!key) {
        return;
      }

      const count = held.get(note) ?? 0;

      if (pressed) {
        held.set(note, count + 1);

        if (count === 0) {
          key.classList.add(ACTIVE_CLASS);
        }

        return;
      }

      if (count <= 1) {
        held.delete(note);
        key.classList.remove(ACTIVE_CLASS);
        return;
      }

      held.set(note, count - 1);
    };

    const run = (index: number, origin: number, gen: number) => {
      if (gen !== generation) {
        return;
      }

      const now = performance.now() - origin;
      let cursor = index;

      while (cursor < PIANO_EVENTS.length && PIANO_EVENTS[cursor].time <= now + 1) {
        const event = PIANO_EVENTS[cursor];
        setPressed(event.note, event.pressed);
        cursor += 1;
      }

      if (cursor >= PIANO_EVENTS.length) {
        timer = window.setTimeout(() => {
          if (gen !== generation) {
            return;
          }

          run(0, performance.now(), gen);
        }, LOOP_REST_MS);
        return;
      }

      const wait = PIANO_EVENTS[cursor].time - (performance.now() - origin);
      timer = window.setTimeout(() => run(cursor, origin, gen), Math.max(0, wait));
    };

    const start = () => {
      if (playing || motionQuery.matches) {
        return;
      }

      playing = true;
      run(0, performance.now(), generation);
    };

    const sync = () => {
      frame = 0;

      if (disposed) {
        return;
      }

      if (document.visibilityState === "hidden" || motionQuery.matches) {
        if (playing) {
          stop();
        }

        return;
      }

      const fraction = exposedFraction(root);

      if (!playing && fraction >= EXPOSE_START) {
        start();
      } else if (playing && fraction < EXPOSE_STOP) {
        stop();
      }
    };

    const scheduleSync = () => {
      if (frame !== 0) {
        return;
      }

      frame = window.requestAnimationFrame(sync);
    };

    const revealSpace = root.closest(".footer-reveal-space");
    const revealObserver = revealSpace === null ? null : new MutationObserver(scheduleSync);

    if (revealSpace && revealObserver) {
      revealObserver.observe(revealSpace, { attributes: true, attributeFilter: ["data-reveal"] });
    }

    const resizeObserver = new ResizeObserver(scheduleSync);
    resizeObserver.observe(root);

    document.addEventListener("visibilitychange", sync);
    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync);
    window.visualViewport?.addEventListener("resize", scheduleSync);
    window.visualViewport?.addEventListener("scroll", scheduleSync);
    motionQuery.addEventListener("change", sync);
    scheduleSync();

    return () => {
      disposed = true;

      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }

      revealObserver?.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
      window.visualViewport?.removeEventListener("resize", scheduleSync);
      window.visualViewport?.removeEventListener("scroll", scheduleSync);
      motionQuery.removeEventListener("change", sync);
      stop();
    };
  }, [rootRef]);
}

function collectActiveNotes(keys: HTMLElement) {
  const active = new Set<string>();

  for (const element of keys.querySelectorAll<HTMLElement>(`.${ACTIVE_CLASS}`)) {
    const note = element.dataset.note;

    if (note) {
      active.add(note);
    }
  }

  return active;
}

function usePianoDotMatrix(
  rootRef: RefObject<HTMLDivElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  palette: PianoPaletteId,
) {
  const paletteRef = useRef(palette);
  const paintRef = useRef<() => void>(() => {});
  const refreshRef = useRef<() => void>(() => {});

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const keys = root?.querySelector<HTMLElement>(".piano-keyboard__keys");
    const context = canvas?.getContext("2d");

    if (!root || !canvas || !keys || !context) {
      return;
    }

    let frame = 0;
    let dpr = 1;
    let layout = measurePianoDotLayout(root, keys, paletteRef.current);
    let glyphMask: HTMLCanvasElement | null = null;

    const paint = () => {
      frame = 0;

      if (!layout) {
        return;
      }

      const activeNotes = collectActiveNotes(keys);

      if (paletteRef.current !== "malayalam") {
        paintPianoDots(context, layout, paletteRef.current, activeNotes);
        return;
      }

      glyphMask ??= buildPianoGlyphMask(layout, dpr);

      if (!glyphMask) {
        context.clearRect(0, 0, layout.width, layout.height);
        return;
      }

      paintPianoGlyphs(context, layout, dpr, glyphMask, activeNotes);
    };

    const resize = () => {
      const next = measurePianoDotLayout(root, keys, paletteRef.current);
      layout = next;
      glyphMask = null;

      if (!next) {
        return;
      }

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(next.width * dpr);
      canvas.height = Math.round(next.height * dpr);
      canvas.style.width = `${next.width}px`;
      canvas.style.height = `${next.height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint();
    };

    const schedulePaint = () => {
      if (frame !== 0) {
        return;
      }

      frame = window.requestAnimationFrame(paint);
    };

    const classObserver = new MutationObserver(schedulePaint);
    classObserver.observe(keys, { attributes: true, attributeFilter: ["class"], subtree: true });

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    resizeObserver.observe(keys);
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    paintRef.current = schedulePaint;
    refreshRef.current = resize;
    resize();

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }

      paintRef.current = () => {};
      refreshRef.current = () => {};
      classObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
    };
  }, [canvasRef, rootRef]);

  useEffect(() => {
    paletteRef.current = palette;
    refreshRef.current();

    if (palette === "malayalam") {
      void loadPianoGlyphFont().then((loaded) => {
        if (loaded && paletteRef.current === "malayalam") {
          paintRef.current();
        }
      });
    }
  }, [palette]);
}

const PALETTE_OPTIONS = [
  { id: "site", label: "Site" },
  { id: "multicolor", label: "Multicolor" },
  { id: "malayalam", label: "Malayalam" },
] as const satisfies readonly { id: PianoPaletteId; label: string }[];

function PianoPaletteSwitch({
  onChange,
  palette,
}: {
  onChange: (palette: PianoPaletteId) => void;
  palette: PianoPaletteId;
}) {
  return (
    <fieldset className="piano-keyboard-switch">
      <legend className="sr-only">Piano color treatment</legend>
      {PALETTE_OPTIONS.map((option) => (
        <label className="piano-keyboard-switch__option" key={option.id}>
          <input
            checked={palette === option.id}
            name="piano-palette-treatment"
            onChange={() => onChange(option.id)}
            type="radio"
            value={option.id}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function PianoKeyboard() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [palette, setPalette] = useState<PianoPaletteId>("site");
  usePianoPhrase(rootRef);
  usePianoDotMatrix(rootRef, canvasRef, palette);

  return (
    <div className="piano-keyboard-frame">
      {/* Temporary local comparison. Remove this switch after choosing a palette. */}
      {process.env.NODE_ENV === "development" ? (
        <PianoPaletteSwitch onChange={setPalette} palette={palette} />
      ) : null}
      <div aria-hidden="true" className="piano-keyboard" data-palette={palette} ref={rootRef}>
        <canvas className="piano-keyboard__dots" ref={canvasRef} />
        <div className="piano-keyboard__keys">
          {PIANO_KEYS.white.map((key) => (
            <div
              className="piano-keyboard__key piano-keyboard__key--white"
              data-note={key.id}
              data-piano-key="white"
              key={key.id}
            />
          ))}
          {PIANO_KEYS.black.map((key) => (
            <div
              className="piano-keyboard__key piano-keyboard__key--black"
              data-note={key.id}
              data-piano-key="black"
              key={key.id}
              style={{ "--piano-key-index": key.whiteIndex } as CSSProperties}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
