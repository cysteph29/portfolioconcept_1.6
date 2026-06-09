import { FoldWrapper } from "@/components/folds/fold-wrapper";

type TwoColumnFoldShellProps = {
  left: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function TwoColumnFoldShell({ left, children, className }: TwoColumnFoldShellProps) {
  return (
    <FoldWrapper className={["two-column-fold-shell", className].filter(Boolean).join(" ")}>
      <aside className="two-column-fold-shell__left">{left}</aside>
      <main className="two-column-fold-shell__right">{children}</main>
    </FoldWrapper>
  );
}
