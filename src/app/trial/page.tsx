import { HeroSection } from "@/components/home/hero-section";
import { TextReveal05Initializer } from "@/components/home/text-reveal-05-initializer";
import { GoldenGateCanvas } from "@/components/trial/golden-gate-canvas";
import { GoldenGateMusicCanvas } from "@/components/trial/golden-gate-music-canvas";
import { BravuraBridgeCanvas } from "@/components/trial/bravura-bridge-canvas";
import { MalayalamBridgeCanvas } from "@/components/trial/malayalam-bridge-canvas";

export default function TrialPage() {
  return (
    <div className="trial-page">
      <HeroSection
        backgroundLayerContent={<GoldenGateCanvas />}
        id="section-concept-1"
        withBackgroundLayer
      />
      <HeroSection
        backgroundLayerContent={<GoldenGateMusicCanvas />}
        id="section-concept-2"
        withBackgroundLayer
      />
      <HeroSection
        backgroundLayerContent={<BravuraBridgeCanvas />}
        id="section-concept-3"
        withBackgroundLayer
      />
      <HeroSection
        backgroundLayerContent={<MalayalamBridgeCanvas />}
        id="section-concept-4"
        withBackgroundLayer
      />
      <TextReveal05Initializer scopeSelector=".trial-page" />
    </div>
  );
}
