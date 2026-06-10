"use client";

/* eslint-disable @next/next/no-img-element -- SVG case study assets must bypass the Next image optimizer. */

import Image from "next/image";
import { createPortal } from "react-dom";
import {
  type CSSProperties,
  type MouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";

export type CaseFigureProps = {
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
  ratio?: string;
};

// Derived from CaseStudyPageLayout/globals.css:
// content sits inside a 72rem max grid, subtracting the 14rem TOC column and
// clamp(2rem, 5vw, 5rem) gap; below 800px the TOC is hidden, so the column is
// the viewport minus the layout's clamp(2rem, 7vw, 5.75rem) side padding.
// 1336px = 72rem max content shell + 2 * 5.75rem max side padding.
const CASE_FIGURE_SIZES =
  "(max-width: 800px) calc(100vw - 2 * clamp(2rem, 7vw, 5.75rem)), " +
  "(max-width: 1336px) calc(100vw - 2 * clamp(2rem, 7vw, 5.75rem) - 14rem - clamp(2rem, 5vw, 5rem)), " +
  "calc(72rem - 14rem - clamp(2rem, 5vw, 5rem))";

const LIGHTBOX_SIZES = "90vw";

function isSvgSource(src: string) {
  return src.split(/[?#]/)[0]?.toLowerCase().endsWith(".svg") ?? false;
}

export function CaseFigure({
  src,
  alt,
  caption,
  width,
  height,
  ratio,
}: CaseFigureProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isLightboxVisible, setIsLightboxVisible] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const isSvg = isSvgSource(src);
  const frameStyle = {
    ...(ratio ? { aspectRatio: ratio } : {}),
    borderWidth: "var(--border-width-hairline)",
    borderStyle: "solid",
    borderColor: "var(--color-text-muted)",
  } satisfies CSSProperties;
  const imageClassName = ratio
    ? "block h-full w-full object-contain"
    : "block h-auto w-full";

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHasMounted(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const triggerElement = triggerRef.current;
    const focusFrame = window.requestAnimationFrame(() => {
      setIsLightboxVisible(true);
      dialogRef.current?.focus();
    });

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsLightboxOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      setIsLightboxVisible(false);
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.requestAnimationFrame(() => {
        triggerElement?.focus();
      });
    };
  }, [isLightboxOpen]);

  const closeLightbox = () => setIsLightboxOpen(false);

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeLightbox();
    }
  };

  const lightbox =
    hasMounted && isLightboxOpen
      ? createPortal(
          <div
            aria-label={`Image preview: ${caption ?? alt}`}
            aria-modal="true"
            className={[
              "fixed inset-0 z-[2147483647] flex cursor-zoom-out items-center justify-center p-4",
              "bg-[rgb(6_21_2_/_78%)] opacity-0 transition-opacity duration-200 ease-out",
              isLightboxVisible ? "opacity-100" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onMouseDown={handleBackdropMouseDown}
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <button
              aria-label="Close image preview"
              className={[
                "cursor-zoom-out border-0 bg-transparent p-0 opacity-0 transition-opacity duration-200 ease-out",
                isLightboxVisible ? "opacity-100" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={closeLightbox}
              type="button"
            >
              {isSvg ? (
                <img
                  alt={alt}
                  className="block h-auto max-h-[90vh] max-w-[90vw] w-auto"
                  height={height}
                  loading="lazy"
                  src={src}
                  width={width}
                />
              ) : (
                <Image
                  alt={alt}
                  className="block h-auto max-h-[90vh] max-w-[90vw] w-auto"
                  height={height}
                  sizes={LIGHTBOX_SIZES}
                  src={src}
                  width={width}
                />
              )}
            </button>
          </div>,
          document.body,
        )
      : null;

  return (
    <figure className="flex flex-col gap-2">
      <button
        aria-label={`Open image preview: ${caption ?? alt}`}
        className="relative block w-full cursor-zoom-in overflow-hidden bg-fold-fill p-0 text-left"
        onClick={() => setIsLightboxOpen(true)}
        ref={triggerRef}
        style={frameStyle}
        type="button"
      >
        {isSvg ? (
          <img
            alt={alt}
            className={imageClassName}
            height={height}
            loading="lazy"
            src={src}
            width={width}
          />
        ) : (
          <Image
            alt={alt}
            className={imageClassName}
            height={height}
            sizes={CASE_FIGURE_SIZES}
            src={src}
            width={width}
          />
        )}
      </button>

      {caption ? (
        <figcaption className="font-pixel text-[0.625rem] leading-4 text-left text-text-muted">
          {caption}
        </figcaption>
      ) : null}

      {lightbox}
    </figure>
  );
}
