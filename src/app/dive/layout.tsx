import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function DiveReviewLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <script
        src="https://inflight.co/widget.js"
        data-org="aius9qpt"
        data-path="/dive"
        async
      />
      {children}
    </>
  );
}
