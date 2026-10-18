import { type CSSProperties } from "react";

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

type WhiteKey = {
  id: string;
};

type BlackKey = {
  id: string;
  whiteIndex: number;
};

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

export function PianoKeyboard() {
  return (
    <div aria-hidden="true" className="piano-keyboard">
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
  );
}
