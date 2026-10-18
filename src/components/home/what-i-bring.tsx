import { CapabilityCanvas } from "@/components/home/capability-canvas";
import { WhatIBringEmphasis } from "@/components/home/what-i-bring-emphasis";
import { CAPABILITIES, WHAT_I_BRING_HEADING } from "@/config/what-i-bring";

export function WhatIBring() {
  return (
    <section aria-labelledby="what-i-bring-heading" className="what-i-bring" id="what-i-bring">
      <WhatIBringEmphasis />
      <h2 className="what-i-bring__heading text-heading-2 text-text-primary" id="what-i-bring-heading">
        {WHAT_I_BRING_HEADING}
      </h2>
      <ol className="what-i-bring__rows">
        {CAPABILITIES.map((capability) => (
          <li className="what-i-bring__row" key={capability.id}>
            <div aria-hidden="true" className="what-i-bring__figure">
              {capability.id === "hard-problems" ? (
                <CapabilityCanvas figure="hard-problems" />
              ) : (
                <span className="what-i-bring__figure-label">{capability.illustrationConcept}</span>
              )}
            </div>
            <div className="what-i-bring__copy">
              <h3 className="what-i-bring__headline text-text-primary">{capability.headline}</h3>
              <p className="what-i-bring__description text-body-2 text-text-muted">
                {capability.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
