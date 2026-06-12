"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/#work", label: "Work", isActive: (pathname: string) => pathname.startsWith("/work") },
  { href: "/about", label: "About", isActive: (pathname: string) => pathname === "/about" },
  { href: "/#contact", label: "Contact", isActive: () => false },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="top-nav-surface fixed inset-x-0 top-0 z-50">
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
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

