"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { ContactFooter } from "@/components/home/contact-footer";
import {
  isBrowserHistoryScroll,
  notifyPagePixelScrollSettled,
  readInternalPageTransitionHref,
  requestPagePixelTransition,
  usePagePixelTransition,
} from "@/components/navigation/page-pixel-transition";
import { PageSmoothScroll } from "@/components/navigation/page-smooth-scroll";
import { scrollToElement, scrollToPosition } from "@/components/navigation/smooth-scroll";
import { TopNav } from "@/components/navigation/top-nav";

function scrollToLocationHash() {
  const { hash } = window.location;

  if (!hash) {
    return false;
  }

  const target = document.getElementById(decodeURIComponent(hash.slice(1)));

  if (!target) {
    return false;
  }

  scrollToElement(target, {
    block: target.dataset.reveal === "active" ? "end" : "start",
    behavior: "instant",
  });

  return true;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pixelTransition = usePagePixelTransition();

  useEffect(() => {
    const lastPathname = window.sessionStorage.getItem("portfolio-last-pathname");
    const visitCount = Number.parseInt(
      window.sessionStorage.getItem("portfolio-in-app-visit-count") ?? "0",
      10,
    );

    if (!lastPathname) {
      window.sessionStorage.setItem("portfolio-in-app-visit-count", "1");
    } else if (lastPathname !== pathname) {
      window.sessionStorage.setItem(
        "portfolio-in-app-visit-count",
        String(Number.isFinite(visitCount) ? visitCount + 1 : 1),
      );
    }

    window.sessionStorage.setItem("portfolio-last-pathname", pathname);
  }, [pathname]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (!isBrowserHistoryScroll(pathname)) {
        if (!scrollToLocationHash()) {
          // The shell persists between App Router navigations, so explicitly reset
          // the document scroll position when the route changes.
          scrollToPosition(0, 0);
        }
      }

      notifyPagePixelScrollSettled();
    });

    const onHashChange = () => {
      scrollToLocationHash();
    };

    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const transitionHref = readInternalPageTransitionHref(event);

      if (transitionHref) {
        const result = requestPagePixelTransition({ type: "push", href: transitionHref });

        if (result !== "bypass") {
          event.preventDefault();
          return;
        }
      }

      const link = (event.target as Element | null)?.closest?.("a");

      if (!link) {
        return;
      }

      const url = new URL(link.href, window.location.href);

      if (url.origin !== window.location.origin || url.hash !== "#contact") {
        return;
      }

      if (url.pathname !== window.location.pathname) {
        return;
      }

      event.preventDefault();
      const nextUrl = `${url.pathname}${url.search}#contact`;

      if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) {
        window.history.pushState(null, "", nextUrl);
      }

      scrollToLocationHash();
    };

    window.addEventListener("hashchange", onHashChange);
    document.addEventListener("click", onClick, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onClick, true);
    };
  }, [pathname]);

  return (
    <>
      <div inert={pixelTransition.active ? true : undefined}>
        <TopNav />
        <main className="bg-canvas">{children}</main>
        <ContactFooter reveal variant="editorial" />
      </div>
      {pixelTransition.overlay}
      <PageSmoothScroll />
    </>
  );
}
