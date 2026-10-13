export const DIVE_REVIEW_PREFIX = "/dive";

export function isDiveReviewPath(pathname: string): boolean {
  return pathname === DIVE_REVIEW_PREFIX || pathname.startsWith(`${DIVE_REVIEW_PREFIX}/`);
}

export function toReviewHref(href: string, review: boolean): string {
  if (!review || href.startsWith("#") || href.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(href)) {
    return href;
  }

  if (
    href === DIVE_REVIEW_PREFIX ||
    href.startsWith(`${DIVE_REVIEW_PREFIX}/`) ||
    href.startsWith(`${DIVE_REVIEW_PREFIX}#`)
  ) {
    return href;
  }

  if (href === "/") {
    return DIVE_REVIEW_PREFIX;
  }

  if (href.startsWith("/#")) {
    return `${DIVE_REVIEW_PREFIX}${href.slice(1)}`;
  }

  if (
    href === "/about" ||
    href.startsWith("/about/") ||
    href.startsWith("/about#") ||
    href.startsWith("/about?")
  ) {
    return `${DIVE_REVIEW_PREFIX}${href}`;
  }

  if (
    href === "/playground" ||
    href.startsWith("/playground/") ||
    href.startsWith("/playground#") ||
    href.startsWith("/playground?")
  ) {
    return `${DIVE_REVIEW_PREFIX}${href}`;
  }

  const workPage = href.match(/^\/work\/([^/?#]+)([?#].*)?$/);
  if (workPage && !workPage[1].includes(".")) {
    return `${DIVE_REVIEW_PREFIX}${href}`;
  }

  return href;
}
