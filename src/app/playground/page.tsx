import type { Metadata } from "next";

import { HeroSection } from "@/components/home/hero-section";
import { PlaygroundCardGrid } from "@/components/playground/playground-card-grid";

export const metadata: Metadata = {
  title: "Playground — Cyril Stephen",
  description: "Explore experiments in design, code, AI, and music by product designer Cyril Stephen.",
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
