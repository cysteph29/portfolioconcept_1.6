import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";

import { AppShell } from "@/components/navigation/app-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: "Cyril's Portfolio",
  description: "Product designer specializing in compliance-driven, data-heavy products across fintech and regulated industries.",
  metadataBase: new URL("https://cyrilstephen.com"),
  icons: {
    icon: [{ url: "/assets/profilepic.png", type: "image/png" }],
    apple: [{ url: "/assets/profilepic.png", type: "image/png" }],
  },
  openGraph: {
    title: "Cyril's Portfolio",
    description: "Product designer specializing in compliance-driven, data-heavy products across fintech and regulated industries.",
    url: "https://cyrilstephen.com",
    siteName: "Cyril's Portfolio",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/assets/social-preview.png",
        width: 1200,
        height: 630,
        alt: "Cyril Stephen — Product Designer specializing in fintech and regulated industries",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cyril's Portfolio",
    description: "Product designer specializing in compliance-driven, data-heavy products across fintech and regulated industries.",
    images: ["/assets/social-preview.png"],
    creator: "@cyril_design",
  },
};

// GA4 enhanced measurement handles page views (including history navigation),
// outbound links and downloads. Custom events describe portfolio intent only.
const portfolioAnalyticsScript = `
(() => {
  if (!['cyrilstephen.com', 'www.cyrilstephen.com'].includes(location.hostname)) return;
  if (navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', 'G-17RZ1N4TZN', {
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=G-17RZ1N4TZN';
  document.head.appendChild(tag);

  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link) return;
    const url = new URL(link.href, location.href);
    const label = (link.textContent || link.getAttribute('aria-label') || '').trim();
    const params = { page_path: location.pathname, link_path: url.pathname };
    if (/^resume$/i.test(label)) {
      gtag('event', 'resume_click', params);
    } else if (url.protocol === 'mailto:' || (url.origin === location.origin && url.hash === '#contact')) {
      gtag('event', 'contact_click', { page_path: location.pathname });
    } else if (url.origin === location.origin && /^\\/(dive\\/)?work\\/[^/]+/.test(url.pathname)) {
      gtag('event', 'case_study_click', params);
    } else if (url.hostname === 'www.linkedin.com' || url.hostname === 'linkedin.com') {
      gtag('event', 'linkedin_click', { page_path: location.pathname });
    }
  }, true);

  let path = location.pathname;
  let depths = new Set();
  let scheduled = false;
  window.addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      if (path !== location.pathname) { path = location.pathname; depths = new Set(); }
      const available = document.documentElement.scrollHeight - window.innerHeight;
      if (available <= 0) return;
      const percent = Math.round(window.scrollY / available * 100);
      [25, 50, 75, 90].forEach((depth) => {
        if (percent >= depth && !depths.has(depth)) {
          depths.add(depth);
          gtag('event', 'scroll_depth', { page_path: path, percent_scrolled: depth });
        }
      });
    });
  }, { passive: true });
})();
`;

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
      {process.env.NODE_ENV === "development" ? (
        <head>
          <script
            id="strip-cursor-refs-before-hydration"
            dangerouslySetInnerHTML={{ __html: stripCursorRefsScript }}
          />
        </head>
      ) : null}
      <body className="min-h-full bg-canvas font-sans text-text-primary">
        <AppShell>{children}</AppShell>
        <Script id="portfolio-analytics" strategy="afterInteractive">
          {portfolioAnalyticsScript}
        </Script>
      </body>
    </html>
  );
}
