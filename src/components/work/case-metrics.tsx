export type CaseMetricItem = {
  label: string;
  value: number;
  valueLabel: string;
  max?: number;
};

export type CaseMetricsProps = {
  items: readonly CaseMetricItem[];
  label: string;
  caption?: string;
  variant: "scores" | "deltas";
};

export type CasePercentageCardItem = {
  label: string;
  valueLabel: string;
};

export function CaseMetrics({ caption, items, label, variant }: CaseMetricsProps) {
  return (
    <figure aria-label={label} className={`case-metrics case-metrics--${variant}`}>
      <ol className="case-metrics__list">
        {items.map((item) => (
          <li className="case-metric" key={item.label}>
            <span className="case-metric__value text-display-3">{item.valueLabel}</span>
            <span className="case-metric__label text-body-2">{item.label}</span>
          </li>
        ))}
      </ol>
      {caption ? <figcaption className="case-metrics__caption">{caption}</figcaption> : null}
    </figure>
  );
}

export function CasePercentageCards({
  items,
  label,
}: {
  items: readonly CasePercentageCardItem[];
  label: string;
}) {
  return (
    <figure aria-label={label} className="case-percentage-cards">
      <ol className="case-percentage-cards__grid">
        {items.map((item) => (
          <li className="case-percentage-card" key={item.label}>
            <span className="case-percentage-card__value text-display-3">{item.valueLabel}</span>
            <span className="case-percentage-card__label text-body-2">{item.label}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
