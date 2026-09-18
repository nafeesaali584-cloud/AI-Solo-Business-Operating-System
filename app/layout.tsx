import type { Metadata } from "next";
import "./globals.css";
import { BusinessBrainProvider } from "@/context/BusinessBrainContext";
import { AppShell } from "@/components/layout/AppShell";

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
      <body className="bg-[#0c0c0e] text-zinc-100 antialiased selection:bg-amber-500 selection:text-zinc-950">
        <BusinessBrainProvider>
          <AppShell>{children}</AppShell>
        </BusinessBrainProvider>
      </body>
    </html>
  );
}
