"use client";

import { TransitionLink } from "@/components/navigation/transition-link";

export function BackToWorkLink() {
  return (
    <TransitionLink
      axis="y"
      className="inline-flex rounded-full border border-white/30 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-white transition hover:bg-white/15"
      direction={-1}
      href="/work"
      scroll
    >
      Back To Work
    </TransitionLink>
  );
}
