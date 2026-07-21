"use client";

import { useEffect } from "react";

import { textReveal05 } from "@/components/home/text-reveal-05";

type Cleanup = () => void;

type TextReveal05InitializerProps = {
  scopeSelector?: string;
};

export function TextReveal05Initializer({
  scopeSelector = ".home-page",
}: TextReveal05InitializerProps = {}) {
  useEffect(() => {
    let cleanup: Cleanup | undefined;
    let cancelled = false;

    const init = () => {
      if (cancelled) {
        return;
      }

      const homePage = document.querySelector(scopeSelector);

      if (!homePage) {
        return;
      }

      cleanup?.();
      cleanup = textReveal05(homePage);
    };

    document.fonts.ready.then(init);

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [scopeSelector]);

  return null;
}
