"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UploadCloud,
  Users,
  Briefcase,
  FileText,
  Receipt,
  CheckSquare,
  Settings,
  Search,
  Sparkles,
  Layers,
  ChevronRight,
  Shield,
} from "lucide-react";
import { useBusinessBrain } from "@/context/BusinessBrainContext";
import { CopilotDrawer } from "@/components/copilot/CopilotDrawer";
import { GlobalSearchModal } from "@/components/search/GlobalSearchModal";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { toggleCopilot, isCopilotOpen } = useBusinessBrain();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const isWorkspaceA =
    pathname.startsWith("/leads") ||
    pathname.startsWith("/import") ||
    pathname === "/dashboard" ||
    pathname === "/";

  const isWorkspaceB =
    pathname.startsWith("/clients") ||
    pathname.startsWith("/proposals") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/onboarding");

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-zinc-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 h-14 bg-[#111114]/90 backdrop-blur border-b border-[#232328] px-4 flex items-center justify-between">
        {/* Logo & Workspace Identifier */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-bold text-zinc-950 text-sm shadow-md shadow-amber-900/20">
              CP
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-zinc-100 group-hover:text-amber-400 transition">
                ClientPulse
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] text-zinc-500 font-medium tracking-wide uppercase">
                Solo-Business OS
              </span>
            </div>
          </Link>

          <div className="h-4 w-px bg-zinc-800" />

          {/* Active Workspace Pill */}
          <div className="flex items-center text-xs">
            {isWorkspaceB ? (
              <span className="px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/50 flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                Workspace B: Conversion &amp; Delivery
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/50 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Workspace A: Lead Intelligence
              </span>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Global Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#18181e] hover:bg-[#202028] border border-[#272730] text-xs text-zinc-400 hover:text-zinc-200 transition"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden md:inline">Quick Search...</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] bg-[#121215] border border-zinc-700 rounded text-zinc-400">
              Ctrl+K
            </kbd>
          </button>

          {/* AI Copilot Toggle Button */}
          <button
            onClick={toggleCopilot}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition shadow-sm ${
              isCopilotOpen
                ? "bg-amber-500 text-zinc-950 border-amber-400"
                : "bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border-amber-800/60"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Copilot</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 pulse-indicator ml-0.5" />
          </button>
        </div>
      </header>

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <aside className="w-60 bg-[#0f0f12] border-r border-[#202025] flex flex-col justify-between py-4 px-3 flex-shrink-0">
          <div className="space-y-6">
            {/* Global / Primary */}
            <div>
              <div className="px-2 pb-1.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Overview
              </div>
              <nav className="space-y-0.5">
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition ${
                    pathname === "/dashboard" || pathname === "/"
                      ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-400" />
                  <span>My Work</span>
                </Link>
              </nav>
            </div>

            {/* Workspace A: Lead Intelligence & Outreach */}
            <div>
              <div className="px-2 pb-1.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                <span>Workspace A</span>
                <span className="text-[10px] text-amber-400 font-normal">Outreach</span>
              </div>
              <nav className="space-y-0.5">
                <Link
                  href="/import"
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition ${
                    pathname === "/import"
                      ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>CSV Import</span>
                </Link>
                <Link
                  href="/leads"
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition ${
                    pathname.startsWith("/leads")
                      ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Lead Engine</span>
                </Link>
              </nav>
            </div>

            {/* Workspace B: Client Conversion & Delivery */}
            <div>
              <div className="px-2 pb-1.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                <span>Workspace B</span>
                <span className="text-[10px] text-blue-400 font-normal">Delivery</span>
              </div>
              <nav className="space-y-0.5">
                <Link
                  href="/clients"
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition ${
                    pathname.startsWith("/clients")
                      ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Client List</span>
                </Link>
                <Link
                  href="/proposals/builder"
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition ${
                    pathname.startsWith("/proposals")
                      ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Proposal Builder</span>
                </Link>
                <Link
                  href="/invoices/builder"
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition ${
                    pathname.startsWith("/invoices")
                      ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>Invoice Builder</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-[#202025] space-y-1">
            <Link
              href="/settings"
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition ${
                pathname === "/settings"
                  ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings &amp; Gates</span>
            </Link>

            <div className="p-2.5 rounded-lg bg-[#141418] border border-[#222228] text-[11px] text-zinc-400">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-300 mb-0.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>5 Hard Gates Active</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-tight">
                AI action executions require explicit human approval.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Workspace Body */}
        <main className="flex-1 overflow-y-auto bg-[#0c0c0e] p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Global AI Copilot Sliding Drawer (S10) */}
      <CopilotDrawer />

      {/* Global Search Modal (S11) */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
