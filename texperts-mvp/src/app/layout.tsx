import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "texperts.ai — Multi-Agent Simulation",
  description:
    "Watch AI agents debate, collaborate, and think in a 2D tile world powered by Claude.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#1a1520] text-[#e8dfd0] antialiased">{children}</body>
    </html>
  );
}
