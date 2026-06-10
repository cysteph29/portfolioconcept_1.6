import { ExperienceSection } from "@/components/home/experience-section";
import { HeroSection } from "@/components/home/hero-section";
import { WorkSection } from "@/components/home/work-section";

export default function HomePage() {
  return (
    <div className="home-page">
      <HeroSection />
      <WorkSection />
      <ExperienceSection />
    </div>
  );
}
