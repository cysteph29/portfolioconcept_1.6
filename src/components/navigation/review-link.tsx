"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

import { isDiveReviewPath, toReviewHref } from "@/lib/review-path";

type ReviewLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
};

export function ReviewLink({ href, ...props }: ReviewLinkProps) {
  const pathname = usePathname();

  return <Link href={toReviewHref(href, isDiveReviewPath(pathname))} {...props} />;
}
