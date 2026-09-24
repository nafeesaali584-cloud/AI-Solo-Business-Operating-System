"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UploadCloud,
  Users,
  Briefcase,
  FileText,
  Receipt,
  Settings,
  Search,
  Sparkles,
  Shield,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useBusinessBrain } from "@/context/BusinessBrainContext";
import { CopilotDrawer } from "@/components/copilot/CopilotDrawer";
import { GlobalSearchModal } from "@/components/search/GlobalSearchModal";
import { useTheme } from "@/lib/theme/ThemeProvider";

// ─── Sidebar link component ──────────────────────────────────────────────────

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)] font-semibold"
          : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
      }`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${active ? "text-[var(--accent)]" : ""}`} />
      <span>{label}</span>
    </Link>
  );
}

// ─── Section label ───────────────────────────────────────────────────────────

function SectionLabel({
  title,
  badge,
  badgeColor = "var(--accent)",
}: {
  title: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div className="px-2 pb-1.5 text-[11px] font-semibold text-[var(--text-dim)] uppercase tracking-wider flex items-center justify-between">
      <span>{title}</span>
      {badge && (
        <span className="text-[10px] font-medium" style={{ color: badgeColor }}>
          {badge}
        </span>
      )}
    </div>
  );
}

// ─── Reusable Sidebar Navigation Content ─────────────────────────────────────

function SidebarNavContent({
  pathname,
  handleLogout,
  onItemClick,
}: {
  pathname: string;
  handleLogout: () => void;
  onItemClick?: () => void;
}) {
  return (
    <div className="flex flex-col justify-between h-full">
      <div className="space-y-6">
        {/* Overview */}
        <div>
          <SectionLabel title="Overview" />
          <nav className="space-y-0.5">
            <SidebarLink
              href="/dashboard"
              icon={LayoutDashboard}
              label="My Work"
              active={pathname === "/dashboard" || pathname === "/"}
              onClick={onItemClick}
            />
          </nav>
        </div>

        {/* Workspace A */}
        <div>
          <SectionLabel title="Workspace A" badge="Outreach" />
          <nav className="space-y-0.5">
            <SidebarLink
              href="/import"
              icon={UploadCloud}
              label="CSV Import"
              active={pathname === "/import"}
              onClick={onItemClick}
            />
            <SidebarLink
              href="/leads"
              icon={Users}
              label="Lead Engine"
              active={pathname.startsWith("/leads")}
              onClick={onItemClick}
            />
          </nav>
        </div>

        {/* Workspace B */}
        <div>
          <SectionLabel title="Workspace B" badge="Delivery" badgeColor="var(--info)" />
          <nav className="space-y-0.5">
            <SidebarLink
              href="/clients"
              icon={Briefcase}
              label="Client List"
              active={pathname.startsWith("/clients")}
              onClick={onItemClick}
            />
            <SidebarLink
              href="/proposals/builder"
              icon={FileText}
              label="Proposal Builder"
              active={pathname.startsWith("/proposals")}
              onClick={onItemClick}
            />
            <SidebarLink
              href="/invoices/builder"
              icon={Receipt}
              label="Invoice Builder"
              active={pathname.startsWith("/invoices")}
              onClick={onItemClick}
            />
          </nav>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="pt-4 border-t border-[var(--border)] space-y-1">
        <SidebarLink
          href="/settings"
          icon={Settings}
          label="Settings & Gates"
          active={pathname === "/settings"}
          onClick={onItemClick}
        />

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] transition-colors text-left"
          title="Sign out of SoloDeskOS"
          aria-label="Sign out of SoloDeskOS"
        >
          <LogOut className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
          <span>Sign Out</span>
        </button>

        <div className="p-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[11px] text-[var(--text-muted)]">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--text-secondary)] mb-0.5">
            <Shield className="w-3.5 h-3.5 text-[var(--success)] shrink-0" />
            <span>5 Hard Gates Active</span>
          </div>
          <p className="text-[10px] text-[var(--text-dim)] leading-tight">
            AI action executions require explicit human approval.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main AppShell ──────────────────────────────────────────────────────────

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { toggleCopilot, isCopilotOpen } = useBusinessBrain();
  const { setTheme, resolvedTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer automatically when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isLoginPage = pathname === "/login" || pathname === "/";

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  const isWorkspaceB =
    pathname.startsWith("/clients") ||
    pathname.startsWith("/proposals") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/onboarding");

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] flex flex-col font-body">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-30 h-14 bg-[var(--surface)]/95 backdrop-blur border-b border-[var(--border)] px-3 sm:px-4 flex items-center justify-between">
        {/* Left: Mobile Hamburger + Logo + Workspace */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {/* Mobile Hamburger Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="md:hidden p-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
            {/* Profile photo avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--bg)] flex-shrink-0">
              <Image
                src="/brand/profile.jpg"
                alt="Nafeesa Ali"
                width={32}
                height={32}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div>
              <span className="font-heading text-sm sm:text-base font-bold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                SoloDeskOS
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] text-[var(--text-dim)] font-medium tracking-wide uppercase">
                Solo-Business OS
              </span>
            </div>
          </Link>

          <div className="hidden lg:block h-4 w-px bg-[var(--border)]" />

          {/* Active Workspace Pill - visible on tablet and desktop */}
          <div className="hidden md:flex items-center text-xs">
            {isWorkspaceB ? (
              <span className="px-2 py-0.5 rounded-full bg-[var(--info-soft)] text-[var(--info)] border border-[var(--info-border)] flex items-center gap-1 font-medium">
                <Briefcase className="w-3 h-3" />
                <span>Workspace B: Delivery</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)] flex items-center gap-1 font-medium">
                <Users className="w-3 h-3" />
                <span>Workspace A: Outreach</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Actions: Search + Theme + Copilot */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Global Search */}
          <button
            onClick={() => setIsSearchOpen(true)}
            aria-label="Quick search (Ctrl+K)"
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Quick Search...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-[var(--bg)] border border-[var(--border)] rounded text-[var(--text-dim)]">
              Ctrl+K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
            className="p-1.5 sm:p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
            title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* AI Copilot Toggle */}
          <button
            onClick={toggleCopilot}
            aria-label="Toggle AI Copilot drawer"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors shadow-sm shrink-0 ${
              isCopilotOpen
                ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                : "bg-[var(--accent-soft)] hover:bg-[var(--accent-border)] text-[var(--accent)] border-[var(--accent-border)]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Copilot</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] pulse-indicator ml-0.5" />
          </button>
        </div>
      </header>

      {/* ── Main Body with Sidebar + Content ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar (hidden on mobile, visible md+) */}
        <aside className="hidden md:flex w-60 bg-[var(--surface)] border-r border-[var(--border)] flex-col justify-between py-4 px-3 flex-shrink-0">
          <SidebarNavContent pathname={pathname} handleLogout={handleLogout} />
        </aside>

        {/* Mobile Drawer Backdrop Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Drawer (slides in from left) */}
        <aside
          className={`fixed top-14 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-[var(--surface)] border-r border-[var(--border)] flex flex-col py-4 px-3 shadow-2xl md:hidden transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
          }`}
          aria-label="Mobile Navigation Drawer"
        >
          <SidebarNavContent
            pathname={pathname}
            handleLogout={handleLogout}
            onItemClick={() => setIsMobileMenuOpen(false)}
          />
        </aside>

        {/* Main Content Area: Responsive padding for touch screens */}
        <main className="flex-1 overflow-y-auto bg-[var(--bg)] p-3.5 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Global AI Copilot Sliding Drawer */}
      <CopilotDrawer />

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
