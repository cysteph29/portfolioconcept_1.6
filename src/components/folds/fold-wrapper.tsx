type FoldWrapperProps = {
  children: React.ReactNode;
  className?: string;
};

export function FoldWrapper({ children, className }: FoldWrapperProps) {
  return (
    <section className={["fold-panel", className].filter(Boolean).join(" ")}>
      {children}
    </section>
  );
}
