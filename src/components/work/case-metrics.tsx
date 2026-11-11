export type CaseMetricItem = {
  label: string;
  value: number;
  valueLabel: string;
  max?: number;
};

export type CaseQuoteMetricItem = {
  label: string;
  quote: string;
};

export type CaseMetricsProps = {
  items: readonly (CaseMetricItem | CaseQuoteMetricItem)[];
  label: string;
  caption?: string;
  variant: "scores" | "deltas";
};

function isQuoteItem(item: CaseMetricItem | CaseQuoteMetricItem): item is CaseQuoteMetricItem {
  return "quote" in item;
}

export type CasePercentageCardItem = {
  label: string;
  valueLabel: string;
};

export function CaseMetrics({ caption, items, label, variant }: CaseMetricsProps) {
  return (
    <figure aria-label={label} className={`case-metrics case-metrics--${variant}`}>
      <ol className="case-metrics__list">
        {items.map((item) =>
          isQuoteItem(item) ? (
            <li className="case-metric" key={item.label}>
              <blockquote className="case-metric__quote text-body-1">
                <p>{item.quote}</p>
                <footer className="case-metric__label text-body-2">{item.label}</footer>
              </blockquote>
            </li>
          ) : (
            <li className="case-metric" key={item.label}>
              <span className="case-metric__value text-heading-2">{item.valueLabel}</span>
              <span className="case-metric__label text-body-2">{item.label}</span>
            </li>
          ),
        )}
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
            <span className="case-percentage-card__value text-heading-2">{item.valueLabel}</span>
            <span className="case-percentage-card__label text-body-2">{item.label}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
