import Image from "next/image";

import type { CaseStudyOpeningPanel } from "@/config/case-studies";

type CaseStudyOpeningGalleryProps = {
  panels: CaseStudyOpeningPanel[];
  poster?: string;
  title: string;
  videoSrc?: string;
};

function GalleryPlaceholder({ label }: { label: string }) {
  return (
    <div className="case-study-opening-gallery__placeholder-panel">
      <p className="case-study-opening-gallery__placeholder text-body-3">{label}</p>
    </div>
  );
}

function GalleryPanel({
  panel,
  poster,
  primary,
  title,
  videoSrc,
}: {
  panel: CaseStudyOpeningPanel;
  poster?: string;
  primary: boolean;
  title: string;
  videoSrc?: string;
}) {
  if (panel.type === "video" && videoSrc) {
    return (
      <video
        aria-label={`${title} media`}
        autoPlay
        className="case-study-opening-gallery__media"
        loop
        muted
        playsInline
        poster={poster || undefined}
      >
        <source src={videoSrc} />
      </video>
    );
  }

  if (panel.type === "image") {
    return (
      <div className="case-study-opening-gallery__media">
        <Image
          alt={panel.alt}
          className="case-study-opening-gallery__image"
          fill
          sizes={primary ? "(max-width: 800px) 100vw, 66vw" : "(max-width: 800px) 100vw, 33vw"}
          src={panel.src}
        />
      </div>
    );
  }

  const label = panel.type === "placeholder" ? panel.label : `${title} media`;
  return <GalleryPlaceholder label={label} />;
}

export function CaseStudyOpeningGallery({
  panels,
  poster,
  title,
  videoSrc,
}: CaseStudyOpeningGalleryProps) {
  const [primary, upper, lower] = panels;

  if (!primary || !upper || !lower) {
    return null;
  }

  return (
    <div className="case-study-opening-gallery">
      <div className="case-study-opening-gallery__primary">
        <GalleryPanel
          panel={primary}
          poster={poster}
          primary
          title={title}
          videoSrc={videoSrc}
        />
      </div>
      <div className="case-study-opening-gallery__stack">
        <GalleryPanel
          panel={upper}
          poster={poster}
          primary={false}
          title={title}
          videoSrc={videoSrc}
        />
        <GalleryPanel
          panel={lower}
          poster={poster}
          primary={false}
          title={title}
          videoSrc={videoSrc}
        />
      </div>
    </div>
  );
}
