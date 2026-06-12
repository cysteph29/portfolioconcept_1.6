import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";

import { AppShell } from "@/components/navigation/app-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: "Product Design Portfolio Foundation",
  description: "Architecture and navigation prototype with route-driven transitions.",
};

const stripCursorRefsScript = `
(() => {
  const stripCursorRefs = (root = document) => {
    if (root.nodeType === Node.ELEMENT_NODE && root.hasAttribute("data-cursor-ref")) {
      root.removeAttribute("data-cursor-ref");
    }

    root.querySelectorAll?.("[data-cursor-ref]").forEach((element) => {
      element.removeAttribute("data-cursor-ref");
    });
  };

  stripCursorRefs();

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "attributes") {
        mutation.target.removeAttribute("data-cursor-ref");
        return;
      }

      mutation.addedNodes.forEach((node) => stripCursorRefs(node));
    });
  });

  observer.observe(document.documentElement, {
    attributeFilter: ["data-cursor-ref"],
    attributes: true,
    childList: true,
    subtree: true,
  });

  window.addEventListener(
    "load",
    () => {
      window.setTimeout(() => observer.disconnect(), 10000);
    },
    { once: true },
  );
})();
`;

const neueBit = localFont({
  src: [
    {
      path: "./fonts/PPNeueBit-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/PPNeueBit-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-neuebit",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
});

const mondwest = localFont({
  src: "./fonts/PPMondwest-Regular.woff2",
  variable: "--font-mondwest",
  weight: "400",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

// TODO: Convert this TTF to woff2 later for smaller file size.
const fraktion = localFont({
  src: "./fonts/PPFraktionSans-Variable.ttf",
  variable: "--font-fraktion",
  weight: "300 400",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${neueBit.variable} ${mondwest.variable} ${fraktion.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-canvas font-sans text-text-primary">
        {process.env.NODE_ENV === "development" ? (
          <Script
            id="strip-cursor-refs-before-hydration"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: stripCursorRefsScript }}
          />
        ) : null}
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
