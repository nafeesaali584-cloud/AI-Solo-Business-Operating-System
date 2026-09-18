import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { BusinessBrainProvider } from "@/context/BusinessBrainContext";
import { AppShell } from "@/components/layout/AppShell";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ClientPulse — AI Solo-Business Operating System",
  description:
    "An AI-assisted operating system for solo service businesses with strict approval gates, grounded data intelligence, and workflow-first execution.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} bg-[#0c0c0e] text-zinc-100 antialiased selection:bg-amber-500 selection:text-zinc-950`}
        style={{ fontFamily: "var(--font-inter), sans-serif" }}
      >
        <BusinessBrainProvider>
          <AppShell>{children}</AppShell>
        </BusinessBrainProvider>
      </body>
    </html>
  );
}
