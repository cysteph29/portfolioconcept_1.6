"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  MINIATURE_SCALE,
  SHRINK_PHASE_END,
  TRANSITION_DURATION_MS,
  TRANSITION_EASE,
  TRAVEL_PHASE_END,
} from "@/config/transitions";

export type EasingPreset = "ease-in-out" | "ease-out" | "ease-in" | "linear" | "custom";

const EASING_PRESETS: Record<Exclude<EasingPreset, "custom">, [number, number, number, number]> =
  {
    "ease-in-out": [0.42, 0, 0.58, 1],
    "ease-out": [0, 0, 0.58, 1],
    "ease-in": [0.42, 0, 1, 1],
    linear: [0, 0, 1, 1],
  };

type PhaseShareKey = "shrink" | "travel" | "expand";

type PhaseShares = {
  shrink: number;
  travel: number;
  expand: number;
};

export type TransitionTuningSnapshot = {
  durationMs: number;
  miniatureScale: number;
  shrinkPhaseEnd: number;
  travelPhaseEnd: number;
  easing: [number, number, number, number];
};

type TransitionTuningContextValue = {
  snapshot: TransitionTuningSnapshot;
  durationMs: number;
  miniatureScale: number;
  phaseShares: PhaseShares;
  easingPreset: EasingPreset;
  easingCurve: [number, number, number, number];
  setDurationMs: (value: number) => void;
  setMiniatureScale: (value: number) => void;
  setPhaseShare: (key: PhaseShareKey, value: number) => void;
  setEasingPreset: (preset: Exclude<EasingPreset, "custom">) => void;
  setBezierPoint: (index: 0 | 1 | 2 | 3, value: number) => void;
};

const DEFAULT_PHASE_SHARES: PhaseShares = {
  shrink: SHRINK_PHASE_END,
  travel: TRAVEL_PHASE_END - SHRINK_PHASE_END,
  expand: 1 - TRAVEL_PHASE_END,
};

const TransitionTuningContext = createContext<TransitionTuningContextValue | null>(null);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeShares(shares: PhaseShares): PhaseShares {
  const total = shares.shrink + shares.travel + shares.expand;
  if (total <= 0) {
    return DEFAULT_PHASE_SHARES;
  }

  return {
    shrink: shares.shrink / total,
    travel: shares.travel / total,
    expand: shares.expand / total,
  };
}

function detectPreset(curve: [number, number, number, number]): EasingPreset {
  const matches = Object.entries(EASING_PRESETS).find(([, presetCurve]) =>
    presetCurve.every((point, index) => Math.abs(point - curve[index]) < 0.0001),
  );

  return matches ? (matches[0] as Exclude<EasingPreset, "custom">) : "custom";
}

export function TransitionTuningProvider({ children }: { children: ReactNode }) {
  const [durationMs, setDurationMsState] = useState(TRANSITION_DURATION_MS);
  const [miniatureScale, setMiniatureScaleState] = useState(MINIATURE_SCALE);
  const [phaseShares, setPhaseShares] = useState<PhaseShares>(DEFAULT_PHASE_SHARES);
  const [easingCurve, setEasingCurve] =
    useState<[number, number, number, number]>(TRANSITION_EASE);
  const [easingPreset, setEasingPresetState] = useState<EasingPreset>(
    detectPreset(TRANSITION_EASE),
  );

  const setDurationMs = useCallback((value: number) => {
    setDurationMsState(Math.round(clamp(value, 200, 2000)));
  }, []);

  const setMiniatureScale = useCallback((value: number) => {
    setMiniatureScaleState(clamp(value, 0.5, 0.95));
  }, []);

  const setPhaseShare = useCallback((key: PhaseShareKey, value: number) => {
    setPhaseShares((current) => {
      const nextCurrent = { ...current };
      const nextValue = clamp(value, 0.05, 0.9);
      const otherKeys = (Object.keys(current) as PhaseShareKey[]).filter((k) => k !== key);
      const remaining = Math.max(0.1, 1 - nextValue);
      const currentOtherTotal = otherKeys.reduce((sum, otherKey) => sum + current[otherKey], 0);

      nextCurrent[key] = nextValue;

      if (currentOtherTotal <= 0) {
        const evenValue = remaining / otherKeys.length;
        otherKeys.forEach((otherKey) => {
          nextCurrent[otherKey] = evenValue;
        });
      } else {
        otherKeys.forEach((otherKey) => {
          nextCurrent[otherKey] = (current[otherKey] / currentOtherTotal) * remaining;
        });
      }

      return normalizeShares(nextCurrent);
    });
  }, []);

  const setEasingPreset = useCallback((preset: Exclude<EasingPreset, "custom">) => {
    setEasingPresetState(preset);
    setEasingCurve(EASING_PRESETS[preset]);
  }, []);

  const setBezierPoint = useCallback((index: 0 | 1 | 2 | 3, value: number) => {
    setEasingPresetState("custom");
    setEasingCurve((current) => {
      const next = [...current] as [number, number, number, number];
      next[index] = clamp(value, -2, 2);
      return next;
    });
  }, []);

  const snapshot = useMemo<TransitionTuningSnapshot>(() => {
    const normalized = normalizeShares(phaseShares);
    return {
      durationMs,
      miniatureScale,
      shrinkPhaseEnd: normalized.shrink,
      travelPhaseEnd: normalized.shrink + normalized.travel,
      easing: easingCurve,
    };
  }, [durationMs, miniatureScale, phaseShares, easingCurve]);

  const value = useMemo<TransitionTuningContextValue>(
    () => ({
      snapshot,
      durationMs,
      miniatureScale,
      phaseShares,
      easingPreset,
      easingCurve,
      setDurationMs,
      setMiniatureScale,
      setPhaseShare,
      setEasingPreset,
      setBezierPoint,
    }),
    [
      snapshot,
      durationMs,
      miniatureScale,
      phaseShares,
      easingPreset,
      easingCurve,
      setDurationMs,
      setMiniatureScale,
      setPhaseShare,
      setEasingPreset,
      setBezierPoint,
    ],
  );

  return (
    <TransitionTuningContext.Provider value={value}>{children}</TransitionTuningContext.Provider>
  );
}

export function useTransitionTuning() {
  const context = useContext(TransitionTuningContext);
  if (!context) {
    throw new Error("useTransitionTuning must be used inside TransitionTuningProvider.");
  }

  return context;
}
