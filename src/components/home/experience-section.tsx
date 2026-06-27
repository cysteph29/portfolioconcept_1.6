import Image from "next/image";

import { ExperienceCards } from "@/components/experience/experience-cards";

export function ExperienceSection() {
  return (
    <section
      className="home-section home-section--experience experience-fold"
      data-st-03="20"
      data-st-mobile-resolution="14"
      data-st-mode="reveal"
      id="experience"
    >
      <div className="experience-card-list">
        <div className="experience-fold__identity" aria-hidden="true">
          <div className="experience-fold__icon-placeholder">
            <Image
              src="/assets/experience-mosaic.png"
              alt=""
              width={80}
              height={80}
              className="experience-fold__mosaic-image"
            />
          </div>
          <p className="experience-fold__label text-display-2 text-text-primary">
            Experience
          </p>
        </div>
        <ExperienceCards />
      </div>
    </section>
  );
}
