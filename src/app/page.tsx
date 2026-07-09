import { ExperienceSection } from "@/components/home/experience-section";
import { HeroSection } from "@/components/home/hero-section";
import { SectionTransition03 } from "@/components/home/section-transition-03";
import { TextReveal05Initializer } from "@/components/home/text-reveal-05-initializer";
import { WorkSection } from "@/components/home/work-section";

export default function HomePage() {
  return (
    <div className="home-page">
      <HeroSection />
      <WorkSection />
      <ExperienceSection />
      <SectionTransition03 />
      <TextReveal05Initializer />
    </div>
  );
}
