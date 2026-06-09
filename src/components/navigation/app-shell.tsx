"use client";

import { TopNav } from "@/components/navigation/top-nav";
import { TransitionOverlay } from "@/components/navigation/transition-overlay";
import { TransitionProvider, useTransitionContext } from "@/components/navigation/transition-context";
import { TransitionTuningProvider } from "@/components/navigation/transition-tuning-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TransitionTuningProvider>
      <TransitionProvider>
        <ShellFrame>{children}</ShellFrame>
      </TransitionProvider>
    </TransitionTuningProvider>
  );
}

function ShellFrame({ children }: { children: React.ReactNode }) {
  const { isTransitioning } = useTransitionContext();

  return (
    <>
      <TopNav />
      <main
        aria-hidden={isTransitioning ? "true" : undefined}
        className={`bg-canvas ${
          isTransitioning ? "pointer-events-none opacity-0" : ""
        }`}
      >
        {children}
      </main>
      <TransitionOverlay />
    </>
  );
}
