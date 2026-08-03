import type { Metadata } from "next";

import { HeroSection } from "@/components/home/hero-section";
import { PlaygroundCardGrid } from "@/components/playground/playground-card-grid";

export const metadata: Metadata = {
  title: "AI & Play | Cyril's Portfolio",
  description: "Experiments and explorations by Cyril Stephen.",
};

export default function PlaygroundPage() {
  return (
    <div className="playground-page">
      <HeroSection
        headline="An evergrowing collection of things built with AI and other things."
        portraitAlt=""
        portraitSrc="/assets/playground-mosaic.png"
        shouldAnimateHeadline={false}
        showActions={false}
        showSubhead={false}
        withViewportHeight={false}
      />
      <PlaygroundCardGrid />
    </div>
  );
}
