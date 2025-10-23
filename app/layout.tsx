import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FX Trading System - XAUUSD + GBPUSD",
  description: "Multi-pair forex trading system with smart confluence analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.Node;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
