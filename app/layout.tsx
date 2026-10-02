import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EA Action Tracker",
  description: "Track meeting commitments and prioritize follow-ups.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
