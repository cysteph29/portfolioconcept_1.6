import { CaseStudyCards } from "@/components/work/case-study-cards";

export function WorkSection() {
  return (
    <section aria-labelledby="work-heading" className="work-section" id="work">
      <h2 className="sr-only" id="work-heading">
        Work
      </h2>
      <CaseStudyCards />
    </section>
  );
}
