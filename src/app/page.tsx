import { ExperienceSection } from "@/components/home/experience-section";
import { HeroSection } from "@/components/home/hero-section";
import { SectionTransition03 } from "@/components/home/section-transition-03";
import { WorkSection } from "@/components/home/work-section";

export default function HomePage() {
  return (
    <div className="home-page">
      <HeroSection />
      <WorkSection />
      <ExperienceSection />
      <SectionTransition03 />
    </div>
  );
}
