import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Map Maker — Data to Map Visualizer",
  description:
    "Upload data, pick a metric, and instantly visualize India or world maps as choropleths, marker maps, or heatmaps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
