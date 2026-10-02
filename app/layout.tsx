import type { Metadata } from "next";
import "./globals.css";
import { Nav } from '@/components/nav';

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
      <body><Nav /><main className="workspace">{children}</main></body>
    </html>
  );
}
