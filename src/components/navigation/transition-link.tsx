"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { type MouseEvent } from "react";

import { useTransitionContext, type TransitionAxis } from "@/components/navigation/transition-context";

type TransitionLinkProps = LinkProps & {
  children: React.ReactNode;
  className?: string;
  axis: TransitionAxis;
  direction: 1 | -1;
};

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

export function TransitionLink({
  children,
  href,
  className,
  axis,
  direction,
  ...linkProps
}: TransitionLinkProps) {
  const pathname = usePathname();
  const { isTransitioning, startTransition } = useTransitionContext();
  const destination = typeof href === "string" ? href : href.toString();

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (isModifiedClick(event)) {
      return;
    }

    if (pathname === destination || isTransitioning) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    startTransition({
      href: destination,
      axis,
      direction,
      scroll: linkProps.scroll ?? true,
    });
  }

  return (
    <Link {...linkProps} className={className} href={href} onClick={onClick}>
      {children}
    </Link>
  );
}
