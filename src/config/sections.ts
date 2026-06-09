export type TopLevelSectionId = "home" | "work" | "experience" | "about" | "contact";

export type TopLevelSection = {
  id: TopLevelSectionId;
  label: string;
  href: string;
  backgroundClassName: string;
};

export const TOP_LEVEL_SECTIONS: TopLevelSection[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
    backgroundClassName: "bg-slate-900",
  },
  {
    id: "work",
    label: "Work",
    href: "/work",
    backgroundClassName: "bg-indigo-900",
  },
  {
    id: "experience",
    label: "Experience",
    href: "/experience",
    backgroundClassName: "bg-emerald-900",
  },
  {
    id: "about",
    label: "About",
    href: "/about",
    backgroundClassName: "bg-cyan-900",
  },
  {
    id: "contact",
    label: "Contact",
    href: "/contact",
    backgroundClassName: "bg-rose-900",
  },
];

export function getSectionByHref(href: string): TopLevelSection | undefined {
  return TOP_LEVEL_SECTIONS.find((section) => section.href === href);
}

export function getSectionFromPathname(pathname: string): TopLevelSection {
  if (pathname.startsWith("/work")) {
    return TOP_LEVEL_SECTIONS[1];
  }

  return (
    TOP_LEVEL_SECTIONS.find((section) => section.href === pathname) ??
    TOP_LEVEL_SECTIONS[0]
  );
}

export function getSectionIndexFromPathname(pathname: string): number {
  const section = getSectionFromPathname(pathname);
  return TOP_LEVEL_SECTIONS.findIndex((candidate) => candidate.id === section.id);
}

export function getHorizontalDirection(fromPath: string, toPath: string): 1 | -1 {
  const fromIndex = getSectionIndexFromPathname(fromPath);
  const toIndex = getSectionIndexFromPathname(toPath);

  return toIndex >= fromIndex ? 1 : -1;
}
