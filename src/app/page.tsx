import { EditorialIntro } from "@/components/home/editorial-intro";
import { TextReveal05Initializer } from "@/components/home/text-reveal-05-initializer";
import { WorkSection } from "@/components/home/work-section";

export default function HomePage() {
  return (
    <div className="home-page">
      <div className="editorial-stage">
        <EditorialIntro />
        <div className="editorial-content">
          <WorkSection />
          {/* What I Bring is hidden for review. Restore with <WhatIBring /> from @/components/home/what-i-bring. */}
        </div>
      </div>
      <TextReveal05Initializer />
    </div>
  );
}
