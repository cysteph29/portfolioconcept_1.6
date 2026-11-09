import styles from "./trailhead-opening-context.module.css";

type CaseStudyPlaceholderProps = {
  label: string;
  ratio?: string;
};

/**
 * A plain rectangle with a centered label. Each instance is independent,
 * so a later image or video can replace one call site without touching the others.
 */
export function CaseStudyPlaceholder({
  label,
  ratio = "16 / 9",
}: CaseStudyPlaceholderProps) {
  return (
    <div className={styles.placeholder} style={{ aspectRatio: ratio }}>
      <p className={styles.placeholderLabel}>{label}</p>
    </div>
  );
}
