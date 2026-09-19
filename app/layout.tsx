import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { BusinessBrainProvider } from "@/context/BusinessBrainContext";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} font-body antialiased`}
      >
        <ThemeProvider>
          <BusinessBrainProvider>
            <AppShell>{children}</AppShell>
          </BusinessBrainProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
