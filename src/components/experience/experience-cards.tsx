import Image from "next/image";

import { EXPERIENCE_ENTRIES } from "@/config/experience";

export function ExperienceCards() {
  return (
    <>
      {EXPERIENCE_ENTRIES.map((entry, index) => (
        <article
          key={`${entry.logo}-${entry.title}`}
          className={`experience-card experience-card--slot-${index + 1}`}
        >
          <div className="experience-card__tile">
            <Image
              alt={`${entry.title} logo`}
              className="experience-card__logo"
              height={48}
              src={entry.logo}
              width={48}
            />
          </div>
          <div className="experience-card__body">
            <h2 className="experience-card__title text-display-3 text-text-primary">{entry.title}</h2>
            <p className="experience-card__description text-body-2 text-text-muted">
              {entry.description}
            </p>
          </div>
        </article>
      ))}
    </>
  );
}
