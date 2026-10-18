export type Capability = {
  id: string;
  headline: string;
  description: string;
  illustrationConcept: string;
};

export const WHAT_I_BRING_HEADING = "What I Bring";

export const CAPABILITIES: Capability[] = [
  {
    id: "hard-problems",
    headline: "I Like the Hard Problems",
    description:
      "Axway’s invoicing tool had never had a designer. Trailhead’s power users had already left for ChatGPT. I start where the problem is still tangled.",
    illustrationConcept: "Knot → line",
  },
  {
    id: "ai-first",
    headline: "AI-First by Default",
    description:
      "On Trailhead, AI was both the product and the way we built it. We prototyped with it, pressure-tested flows before real users arrived, and dropped the idea that would have spoken as a person.",
    illustrationConcept: "Branching rule",
  },
  {
    id: "design-and-code",
    headline: "I Design and Code",
    description:
      "I design in Figma and ship the prototype in code. For Trailhead’s Solve, the components went straight into a working React app.",
    illustrationConcept: "Sketch → grid",
  },
  {
    id: "customer-driven",
    headline: "Customer-Driven Decisions",
    description:
      "At Axway I pushed for research before the redesign, then followed what the operations team actually did. At Trailhead, the research decided which ideas were worth building.",
    illustrationConcept: "Converging signals",
  },
  {
    id: "end-to-end",
    headline: "End-to-End Ownership",
    description:
      "I am often the only designer, from discovery through handoff. At Axway that was one regulated product. At Intentionally Designed Solutions it was three products from zero.",
    illustrationConcept: "Path → frame",
  },
];
