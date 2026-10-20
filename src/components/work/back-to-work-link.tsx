"use client";

import { usePathname, useRouter } from "next/navigation";

import { requestPagePixelTransition } from "@/components/navigation/page-pixel-transition";
import { isDiveReviewPath, toReviewHref } from "@/lib/review-path";

export function BackToWorkLink() {
  const pathname = usePathname();
  const router = useRouter();

  function returnToPreviousPage() {
    const visitCount = Number.parseInt(
      window.sessionStorage.getItem("portfolio-in-app-visit-count") ?? "0",
      10,
    );

    const review = isDiveReviewPath(pathname);

    if (visitCount > 1) {
      if (requestPagePixelTransition({ type: "back" }) === "bypass") {
        router.back();
      }
      return;
    }

    const href = toReviewHref("/#work", review);
    if (requestPagePixelTransition({ type: "push", href }) === "bypass") {
      router.push(href);
    }
  }

  return (
    <button
      className="inline-flex cursor-pointer rounded-full border border-white/30 bg-transparent px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-white transition hover:bg-white/15"
      onClick={returnToPreviousPage}
      type="button"
    >
      Back To Work
    </button>
  );
}
