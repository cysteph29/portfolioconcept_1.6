"use client";

import { useRouter } from "next/navigation";

export function BackToWorkLink() {
  const router = useRouter();

  function returnToPreviousPage() {
    const visitCount = Number.parseInt(
      window.sessionStorage.getItem("portfolio-in-app-visit-count") ?? "0",
      10,
    );

    if (visitCount > 1) {
      router.back();
      return;
    }

    router.push("/#work");
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
