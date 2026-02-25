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
      <body className="bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  );
}
