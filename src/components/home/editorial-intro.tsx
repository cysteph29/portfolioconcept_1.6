import Image from "next/image";

import { HOME_HERO_HEADLINE, HOME_HERO_SUBHEAD } from "@/components/home/hero-section";
import { MalayalamBridgeCanvas } from "@/components/trial/malayalam-bridge-canvas";

export function EditorialIntro() {
  return (
    <section aria-labelledby="editorial-intro-heading" className="editorial-intro">
      <div className="editorial-intro__copy">
        <Image
          alt="Portrait"
          className="editorial-intro__portrait"
          height={120}
          src="/assets/profilepic.png"
          width={120}
        />
        <h1
          className="editorial-intro__headline text-display text-text-primary"
          data-reveal-05
          id="editorial-intro-heading"
        >
          {HOME_HERO_HEADLINE}
        </h1>
        <p className="editorial-intro__subhead text-body-2 text-text-muted">{HOME_HERO_SUBHEAD}</p>
      </div>
      <div className="editorial-intro__bridge">
        <MalayalamBridgeCanvas pauseWhenOffscreen profile="editorial" showControls={false} />
      </div>
    </section>
  );
}
