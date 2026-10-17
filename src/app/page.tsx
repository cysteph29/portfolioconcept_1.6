import { EditorialIntro } from "@/components/home/editorial-intro";
import { TextReveal05Initializer } from "@/components/home/text-reveal-05-initializer";
import { WorkSection } from "@/components/home/work-section";

export default function HomePage() {
  return (
    <div className="home-page">
      <div className="editorial-stage">
        <EditorialIntro />
        <WorkSection />
      </div>
      <TextReveal05Initializer />
    </div>
  );
}
