import { FoldWrapper } from "@/components/folds/fold-wrapper";

type SectionPlaceholderProps = {
  label: string;
  children?: React.ReactNode;
};

export function SectionPlaceholder({ label, children }: SectionPlaceholderProps) {
  return (
    <FoldWrapper className="fold-placeholder">
      <div className="fold-placeholder__inner">
        <h1 className="fold-placeholder__heading">{label}</h1>
        {children}
      </div>
    </FoldWrapper>
  );
}
