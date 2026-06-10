"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { ContactFooter } from "@/components/home/contact-footer";
import { TopNav } from "@/components/navigation/top-nav";

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
    if (!window.location.hash) {
      return;
    }

    const targetId = decodeURIComponent(window.location.hash.slice(1));
    window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView();
    });
  }, [pathname]);

  return (
    <>
      <TopNav />
      <main className="bg-canvas">{children}</main>
      <ContactFooter />
    </>
  );
}
