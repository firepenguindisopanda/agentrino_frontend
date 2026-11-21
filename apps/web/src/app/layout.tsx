import type { Metadata } from "next";

import { Geist, Geist_Mono } from "next/font/google";

import "../index.css";
import "highlight.js/styles/github-dark.css";
import Header from "@/components/header";
import Providers from "@/components/providers";
import { HealthBanner } from "@/components/HealthBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Agentrino", template: "%s · Agentrino" },
  description: "Specialized AI agents, a strategic Oracle for technical decisions, and live system analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden`}>
        <Providers>
          <div className="flex flex-col h-svh overflow-hidden">
            <Header />
            <HealthBanner />
            <main className="flex-1 min-h-0 overflow-hidden">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
