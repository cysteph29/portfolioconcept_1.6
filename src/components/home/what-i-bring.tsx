import { CapabilityShowcase } from "@/components/home/capability-showcase";
import { CAPABILITIES, WHAT_I_BRING_HEADING } from "@/config/what-i-bring";

export function WhatIBring() {
  return (
    <section aria-labelledby="what-i-bring-heading" className="what-i-bring" id="what-i-bring">
      <CapabilityShowcase
        capabilities={CAPABILITIES}
        heading={WHAT_I_BRING_HEADING}
        headingId="what-i-bring-heading"
      />
    </section>
  );
}
