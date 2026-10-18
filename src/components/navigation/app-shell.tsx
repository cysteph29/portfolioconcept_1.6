"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { ContactFooter } from "@/components/home/contact-footer";
import { TopNav } from "@/components/navigation/top-nav";

function isFooterRevealRoute(pathname: string) {
  return pathname === "/" || pathname === "/dive";
}

function scrollToLocationHash() {
  const { hash } = window.location;

  if (!hash) {
    return false;
  }

  const target = document.getElementById(decodeURIComponent(hash.slice(1)));

  if (!target) {
    return false;
  }

  target.scrollIntoView({
    block: target.dataset.reveal === "active" ? "end" : "start",
    inline: "nearest",
    behavior: "instant",
  });

  return true;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
      if (scrollToLocationHash()) {
        return;
      }

      // The shell persists between App Router navigations, so explicitly reset
      // the document scroll position when the route changes.
      window.scrollTo({ left: 0, top: 0, behavior: "instant" });
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
      <TopNav />
      <main className="bg-canvas">{children}</main>
      <ContactFooter
        reveal={isFooterRevealRoute(pathname)}
        variant={isFooterRevealRoute(pathname) ? "editorial" : "legacy"}
      />
    </>
  );
}
