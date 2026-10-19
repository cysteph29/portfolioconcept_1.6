import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CapabilityCanvas } from "@/components/home/capability-canvas";
import type { CapabilityFigureId } from "@/components/home/capability-figures";
import { CAPABILITIES } from "@/config/what-i-bring";

import styles from "./lipi-compare.module.css";

const FIGURES: Record<string, CapabilityFigureId> = {
  "hard-problems": "interference",
  "ai-first": "completion",
  "design-and-code": "specimen",
  "customer-driven": "case",
  "end-to-end": "seam",
};

export const metadata: Metadata = {
  title: "Lipi comparison",
  robots: { index: false, follow: false },
};

export default function LipiComparePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className={styles.page}>
      <h1 className="text-heading-2">Lipi comparison</h1>
      <p className={`${styles.note} text-body-2`}>
        Temporary review of the five illustrations at 300px. This page is not part of the site.
      </p>
      <ul className={styles.gallery}>
        {CAPABILITIES.map((capability) => (
          <li key={capability.id}>
            <div className={`${styles.frame} what-i-bring__art`}>
              <div className="what-i-bring__art-layer" data-active="true">
                <CapabilityCanvas figure={FIGURES[capability.id]} />
              </div>
            </div>
            <p className={styles.name}>{capability.headline}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
