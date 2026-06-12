"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSmartNavbar } from "@/components/navigation/use-smart-navbar";

const NAV_ITEMS = [
  { href: "/#work", label: "Work", isActive: (pathname: string) => pathname.startsWith("/work") },
  { href: "/about", label: "About", isActive: (pathname: string) => pathname === "/about" },
  { href: "/#contact", label: "Contact", isActive: () => false },
  {
    href: "https://drive.google.com/file/d/1vgbehuPY2rzH--WvdVkO-vv0TGn02LXM/view?usp=sharing",
    label: "Resume",
    isActive: () => false,
    external: true,
  },
];

export function TopNav() {
  const pathname = usePathname();
  const {
    hidden,
    navRef,
    onBlurCapture,
    onClickCapture,
    onFocusCapture,
    onPointerDownCapture,
    shouldReduceMotion,
  } = useSmartNavbar();

  return (
    <motion.header
      animate={{ opacity: hidden ? 0 : 1, y: hidden ? "-100%" : "0%" }}
      className="top-nav-surface fixed inset-x-0 top-0 z-50"
      initial={false}
      onBlurCapture={onBlurCapture}
      onClickCapture={onClickCapture}
      onFocusCapture={onFocusCapture}
      onPointerDownCapture={onPointerDownCapture}
      ref={navRef}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }}
    >
      <nav className="flex items-center justify-between px-[var(--spacing-home-edge-x)] pt-[var(--nav-padding-top)] pb-[var(--nav-padding-bottom)]">
        <Link
          aria-label="Home"
          className="inline-flex items-center"
          href="/"
        >
          <Image
            alt=""
            aria-hidden="true"
            className="block h-10 w-10 object-cover"
            height={40}
            src="/assets/profilepic.png"
            width={40}
          />
        </Link>

        <div className="flex items-center gap-[var(--spacing-home-actions-gap)]">
          {NAV_ITEMS.map((item) => {
            const isActive = item.isActive(pathname);

            return (
              <Link
                key={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`text-label-1 text-text-primary transition-opacity hover:opacity-100 ${
                  isActive ? "opacity-100" : "opacity-80"
                }`}
                href={item.href}
                {...("external" in item && item.external
                  ? { rel: "noopener noreferrer", target: "_blank" }
                  : {})}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </motion.header>
  );
}

