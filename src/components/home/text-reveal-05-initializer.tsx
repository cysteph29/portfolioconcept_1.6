"use client";

import { useEffect } from "react";

import { textReveal05 } from "@/components/home/text-reveal-05";

type Cleanup = () => void;

export function TextReveal05Initializer() {
  useEffect(() => {
    let cleanup: Cleanup | undefined;
    let cancelled = false;

    const init = () => {
      if (cancelled) {
        return;
      }

      const homePage = document.querySelector(".home-page");

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
  }, []);

  return null;
}
