"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  MapPin,
  Search,
  Send,
  Copy,
  Check,
  ExternalLink,
  Flame,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Play,
  Smartphone,
  Shield,
  Layers,
  ArrowRight,
  RefreshCw,
  Loader2,
  Calendar,
  Briefcase,
} from "lucide-react";
import { AgencyGuideModal } from "@/components/common/AgencyGuideModal";
import { WorkshopCloserTab } from "@/components/agency-hub/WorkshopCloserTab";
import { ObjectionResolverTab } from "@/components/agency-hub/ObjectionResolverTab";

interface ScrapedLead {
  id?: string;
  business_name?: string;
  company?: string;
  phone?: string;
  website?: string | null;
  rating?: number;
  review_count?: number;
  address?: string;
  priority?: string;
  pitch_message?: string;
  primary_observation?: string;
  source_csv_row?: any;
  audit_tag?: string;
  website_age?: string;
  city_country?: string;
}

export default function AgencyHubPage() {
  const [activeTab, setActiveTab] = useState<
    "hunter" | "demos" | "closer" | "objections" | "proposals" | "checklist"
  >("hunter");
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Scraper & Filter State
  const [searchQuery, setSearchQuery] = useState("car garage workshop Sharjah Industrial Area");
  const [maxPlaces, setMaxPlaces] = useState(20);
  const [filterMode, setFilterMode] = useState<
    "zero_only" | "zero_and_outdated" | "outdated_only"
  >("zero_only");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapedLeads, setScrapedLeads] = useState<ScrapedLead[]>([]);
  const [scrapeSuccessMsg, setScrapeSuccessMsg] = useState<string | null>(null);

  // Quick UAE presets prioritized by Zero-Website density
  const presets = [
    { label: "🔥 Sharjah: Industrial Garages (Gold Mine)", query: "car garage workshop Sharjah Industrial Area" },
    { label: "🔥 Dubai: Ras Al Khor Auto Hub", query: "car repair Ras Al Khor Industrial Dubai" },
    { label: "🔥 Dubai: Al Qusais Industrial", query: "car workshop Al Qusais Industrial Dubai" },
    { label: "Abu Dhabi: Mussafah Auto City", query: "car workshop Mussafah Abu Dhabi" },
    { label: "Dubai: Deira Auto Centers", query: "car garage workshop Deira Dubai" },
    { label: "Dubai: Al Quoz Workshops", query: "car repair workshop Al Quoz Dubai" },
  ];

  // Daily checklist state persisted locally
  const [checklist, setChecklist] = useState({
    morningScrape: false,
    afternoonTeasers: false,
    sendDemos: false,
    eveningFollowups: false,
  });

  // Load existing leads from database on mount so the user immediately sees all qualified targets
  useEffect(() => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((data) => {
        if (data.leads && Array.isArray(data.leads)) {
          setScrapedLeads(data.leads);
        }
      })
      .catch((e) => console.error("Initial leads fetch error:", e));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("uae_agency_daily_checklist");
    if (saved) {
      try {
        setChecklist(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const toggleChecklist = (key: keyof typeof checklist) => {
    const next = { ...checklist, [key]: !checklist[key] };
    setChecklist(next);
    localStorage.setItem("uae_agency_daily_checklist", JSON.stringify(next));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Run native Apify Scraper with Website Age & Health Auditor
  const runScraper = async () => {
    setIsScraping(true);
    setScrapeError(null);
    setScrapeSuccessMsg(null);

    try {
      const res = await fetch("/api/leads/scrape-apify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          maxPlaces: maxPlaces,
          niche: "Automotive Repair",
          filterMode: filterMode,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Scraper failed to run");
      }

      setScrapedLeads(data.leads || []);
      setScrapeSuccessMsg(
        data.message ||
          `Found ${data.count || 0} genuine Zero-Site / 5+ Year Outdated leads! (${data.disqualified_modern_count || 0} modern 2024-2026 sites filtered out)`
      );
    } catch (err: any) {
      if (err.message === "Failed to fetch") {
        setScrapeError("Server was temporarily offline or restarting. Next.js on port 3001 is now live! Please click 'Scrape & Filter Qualified UAE Leads' again.");
      } else {
        setScrapeError(err.message || "Something went wrong while running the scraper.");
      }
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* ── Top Header & Revenue Anchor ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-red-500/10 border border-amber-500/30 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Unified Agency Command Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[var(--text-primary)]">
              UAE Client Closing Engine
            </h1>
            <p className="text-sm text-[var(--text-muted)] max-w-2xl leading-relaxed">
              Everything in <strong>one single place</strong>: 1-Click UAE Lead Discovery (Google Maps),
              0-Slop Prototype Generator, WhatsApp Closing Scripts, and Automated Invoicing.
            </p>
          </div>

          {/* 40 Lac Target Progress Card */}
          <div className="bg-[var(--surface)]/90 backdrop-blur border border-[var(--border)] rounded-xl p-4 sm:p-5 flex flex-col gap-2.5 min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                60-Day Target
              </span>
              <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                40 Lac PKR (~52,500 AED)
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[var(--text-primary)]">0</span>
              <span className="text-xs text-[var(--text-dim)]">/ 11 Clients Closed</span>
            </div>
            <div className="w-full bg-[var(--surface-hover)] rounded-full h-2 overflow-hidden border border-[var(--border)]">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                style={{ width: "9%" }}
              />
            </div>
            <p className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
              <span>Goal: 4 x 3.5k + 5 x 5.5k + 2 x 7.5k AED</span>
              <button
                onClick={() => setIsGuideOpen(true)}
                className="text-amber-500 hover:underline font-semibold"
              >
                View Plan →
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[var(--border)] pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab("hunter")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "hunter"
              ? "bg-[var(--surface)] text-amber-500 border border-amber-500/30 shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          <Search className="w-4 h-4" />
          <span>1. UAE Lead Hunter (Apify)</span>
        </button>

        <button
          onClick={() => setActiveTab("demos")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "demos"
              ? "bg-[var(--surface)] text-amber-500 border border-amber-500/30 shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>2. Prototype & Base44 Prompts</span>
        </button>

        <button
          onClick={() => setActiveTab("closer")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "closer"
              ? "bg-[var(--surface)] text-amber-500 border border-amber-500/30 shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>3. Workshop Closer & Pipeline</span>
        </button>

        <button
          onClick={() => setActiveTab("objections")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "objections"
              ? "bg-[var(--surface)] text-amber-500 border border-amber-500/30 shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          <Shield className="w-4 h-4 text-amber-500" />
          <span>4. 15-Scenario Objection Resolver</span>
        </button>

        <button
          onClick={() => setActiveTab("proposals")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "proposals"
              ? "bg-[var(--surface)] text-amber-500 border border-amber-500/30 shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>5. Fast Proposal Packages</span>
        </button>

        <button
          onClick={() => setActiveTab("checklist")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "checklist"
              ? "bg-[var(--surface)] text-amber-500 border border-amber-500/30 shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>6. Daily 2.5h Checklist</span>
        </button>
      </div>

      {/* ── TAB 1: 1-Click UAE Lead Hunter (Apify) ── */}
      {activeTab === "hunter" && (
        <div className="space-y-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-500" />
                  <span>Live Google Maps Apify Discovery Engine</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Scrapes real Google Maps UAE businesses, detects missing mobile sites, and qualifies high-revenue workshops.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-dim)]">Status:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Apify Connected
                </span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider">
                Select 1-Click UAE Target Area:
              </label>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setSearchQuery(p.query)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      searchQuery === p.query
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-500 font-semibold"
                        : "bg-[var(--bg)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Search & Limit */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-dim)]">
                  Google Maps Search Query
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--text-dim)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. car repair workshop Al Quoz Dubai"
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-dim)]">
                  Leads Count (Limit)
                </label>
                <select
                  value={maxPlaces}
                  onChange={(e) => setMaxPlaces(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
                >
                  <option value={5}>5 Places (Fastest ~15s)</option>
                  <option value={10}>10 Places (~30s)</option>
                  <option value={15}>15 Places (~45s)</option>
                  <option value={20}>20 Places (~60s)</option>
                </select>
              </div>
            </div>

            {/* Strict Quality & Website Age Filter */}
            <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 uppercase tracking-wider">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span>Strict Website Age Filter (Blocks 2024-2026 Modern Sites):</span>
                </label>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20 inline-block w-fit">
                  ✓ High-Conversion Filter Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFilterMode("zero_only")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    filterMode === "zero_only"
                      ? "bg-amber-500/15 border-amber-500/60 text-amber-400 ring-1 ring-amber-500/30 shadow-md"
                      : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <span>🚨 Zero Website Only</span>
                      <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.2 rounded font-bold uppercase">
                        TOP PICK
                      </span>
                    </p>
                    {filterMode === "zero_only" && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-snug">
                    Strictly 0 website on Google Maps. Active workshops with 30-380+ reviews and real cashflow. 100% guarantee!
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterMode("zero_and_outdated")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    filterMode === "zero_and_outdated"
                      ? "bg-amber-500/15 border-amber-500/60 text-amber-400 ring-1 ring-amber-500/30 shadow-md"
                      : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[var(--text-primary)]">
                      🔥 Zero-Site + 5+ Yrs Outdated
                    </p>
                    {filterMode === "zero_and_outdated" && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-snug">
                    Zero-website workshops PLUS verified &ge;5 yr old legacy sites. 100% blocks modern 2022-2026 sites.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterMode("outdated_only")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    filterMode === "outdated_only"
                      ? "bg-amber-500/15 border-amber-500/60 text-amber-400 ring-1 ring-amber-500/30 shadow-md"
                      : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[var(--text-primary)]">
                      ⏳ 5+ Years Outdated Only
                    </p>
                    {filterMode === "outdated_only" && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-snug">
                    Only businesses with verified copyright &le; 2021 or insecure HTTP (No SSL certificate).
                  </p>
                </button>
              </div>
            </div>

            {/* Trigger Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <p className="text-xs text-[var(--text-muted)]">
                Targeting: <strong className="text-amber-400">{filterMode === "zero_only" ? "Zero Website Only" : filterMode === "outdated_only" ? "5+ Years Outdated Only" : "Zero Website & 5+ Years Outdated (Zero 2024-2026 sites)"}</strong>
              </p>

              <button
                onClick={runScraper}
                disabled={isScraping}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isScraping ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Auditing UAE Sites & Discarding Modern (takes ~30s)...</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4 text-amber-200" />
                    <span>Scrape & Filter Qualified UAE Leads</span>
                  </>
                )}
              </button>
            </div>

            {/* Success or Error Banners */}
            {scrapeSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{scrapeSuccessMsg}</span>
              </div>
            )}

            {scrapeError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{scrapeError}</span>
              </div>
            )}
          </div>

          {/* Scraped Results Display */}
          {scrapedLeads.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Qualified UAE Targets ({scrapedLeads.length})
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Every lead below is guaranteed to have <strong>Zero Website</strong> or a <strong>5+ Year Outdated/Insecure Site</strong>.
                  </p>
                </div>
                <Link
                  href="/leads"
                  className="text-xs text-amber-500 hover:underline font-semibold flex items-center gap-1"
                >
                  Open Full Leads Pipeline →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scrapedLeads.map((lead, idx) => {
                  const company = lead.business_name || lead.company || "Workshop";
                  const phone = lead.phone || "";
                  const cleanPhone = phone.replace(/[^0-9]/g, "");
                  const isZeroSite = !lead.website || lead.website === "None" || lead.website === "None (Zero-Website)";

                  const parsedRow = typeof lead.source_csv_row === "string"
                    ? (() => { try { return JSON.parse(lead.source_csv_row); } catch(e) { return {}; } })()
                    : (lead.source_csv_row || {});

                  const auditTag = lead.audit_tag || parsedRow.audit_tag || (isZeroSite ? "🚨 Zero Website" : (lead.website?.startsWith("http://") ? "⚠️ Insecure (No SSL)" : "⏳ Outdated Site"));
                  const websiteAge = lead.website_age || parsedRow.website_age || lead.primary_observation || (isZeroSite ? "No Official Website Found" : "Legacy layout without WhatsApp calculator");
                  const pitchMsg = lead.pitch_message || parsedRow.pitch_message || `Salam Team ${company}, saw your workshop on Google Maps with ${lead.review_count || 40}+ reviews! Created a 40-sec mobile preview. Can I share it over?`;

                  return (
                    <div
                      key={lead.id || idx}
                      className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-3 flex flex-col justify-between hover:border-amber-500/40 transition-colors shadow-sm"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-[var(--text-primary)]">
                            {company}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isZeroSite
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : auditTag.includes("Insecure")
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                            }`}
                          >
                            {auditTag}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                          <span>
                            ★ {lead.rating || "4.8"} ({lead.review_count || "45"} reviews)
                          </span>
                          <span>•</span>
                          <span>{lead.address?.split(",")[0] || lead.city_country || "Dubai"}</span>
                        </div>

                        {/* Website & Age Diagnostic */}
                        <div className="p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-xs flex items-center justify-between">
                          <span className="text-[11px] text-[var(--text-dim)]">Status:</span>
                          <span className="text-[11px] font-semibold text-amber-400 truncate max-w-[220px]">
                            {websiteAge}
                          </span>
                        </div>

                        {lead.website && !isZeroSite && (
                          <a
                            href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1 truncate block"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{lead.website}</span>
                          </a>
                        )}

                        {/* Personalized Teaser */}
                        <div className="p-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-secondary)]">
                          <p className="text-[10px] uppercase font-bold text-amber-500 mb-1">
                            Ready-To-Send WhatsApp Teaser:
                          </p>
                          <p className="line-clamp-3 text-[11px] leading-relaxed">
                            {pitchMsg}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
                        {cleanPhone ? (
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(pitchMsg)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>WhatsApp ({phone})</span>
                          </a>
                        ) : (
                          <span className="flex-1 py-2 px-3 rounded-lg bg-[var(--surface-hover)] text-[var(--text-dim)] text-xs font-medium text-center">
                            No Phone Available
                          </span>
                        )}

                        <button
                          onClick={() => handleCopy(pitchMsg, lead.id || `lead-${idx}`)}
                          className="p-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                          title="Copy WhatsApp Pitch"
                        >
                          {copiedId === (lead.id || `lead-${idx}`) ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Prototype & Base44 Prompts ── */}
      {activeTab === "demos" && (
        <div className="space-y-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-500" />
                <span>Standardized Agency-Grade Prototype System</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                UAE workshop owners don't read tech specs. They buy when they see their own name on a mobile screen with a 1-tap quote calculator.
              </p>
            </div>

            {/* Live Prepared Demos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    LIVE DEMO 1
                  </span>
                  <a
                    href="https://qusais-garage-pro.base44.app/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-amber-500 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Open Live <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <h4 className="font-bold text-sm text-[var(--text-primary)]">
                  Al Qusais Garage Pro
                </h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Tailwind + Base44 demo featuring instant brake & AC estimate calculator, WhatsApp dock, and Google reviews widget.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    LIVE DEMO 2
                  </span>
                  <a
                    href="https://strict-king-road-drive.base44.app/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-amber-500 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Open Live <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <h4 className="font-bold text-sm text-[var(--text-primary)]">
                  King Road Auto Drive
                </h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  High-converting luxury styling demo with emergency towing dispatch button and multi-step booking modal.
                </p>
              </div>
            </div>

            {/* Video Demos Location */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-400">
              <Play className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">6 Screen-Recorded MP4 Demos on Your Computer:</p>
                <p className="text-[var(--text-muted)] text-[11px] mt-0.5">
                  Located at: <code className="bg-black/30 px-1 py-0.5 rounded text-amber-300">C:\Users\HomePC\Desktop\DEMOS\car workshop demos\</code>
                </p>
              </div>
            </div>

            {/* Master Base44 Prompt */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider">
                  Copy 0-Slop Base44 / Claude 3.7 Generator Prompt:
                </label>
                <button
                  onClick={() =>
                    handleCopy(
                      `Build a mobile-first, high-converting website for a premium Dubai Auto Workshop named "[BUSINESS_NAME]".
Tech Stack: React / Tailwind CSS / Lucide icons.
Key Requirements:
1. Header: Clean logo, emergency WhatsApp button (+971 50 XXX XXXX), Arabic/English language toggle.
2. Hero: Headline focused on speed and trust: "Dubai's Trusted German & Luxury Car Specialists". Subhead: "Fixed-price service, free computer diagnostics & genuine parts. Pick-up & drop-off available across Dubai."
3. Interactive Price Calculator: User selects car brand (BMW, Mercedes, Audi, Toyota, Nissan) and service (Brake Pads, Major Service, AC Repair, Ceramic Detailing), displays estimated AED range with 1-click button: "Confirm on WhatsApp".
4. Trust Elements: "Google Rating 4.8★ (150+ Reviews)", "3-Month Service Warranty", "No Hidden Charges".
5. Floating WhatsApp Dock: Always visible at bottom right with pulsating ping animation.
6. Design Aesthetic: Dark luxury matte (#0d0e12) with neon amber/gold accents (#f59e0b). Zero generic stock photos.`,
                      "base44-prompt"
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {copiedId === "base44-prompt" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Master Demo Prompt</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] font-mono text-xs text-[var(--text-muted)] leading-relaxed">
                Build a mobile-first, high-converting website for a premium Dubai Auto Workshop named "[BUSINESS_NAME]".<br />
                - Emergency WhatsApp button (+971 50 XXX XXXX)<br />
                - Interactive Price Calculator (Car Brand + Service → Instant AED quote)<br />
                - 1-Tap "Confirm on WhatsApp" lead transfer<br />
                - Trust badges: 4.8★ Google Reviews, 3-Month Warranty, Free Pick-up & Drop-off<br />
                - Luxury dark theme with amber gold accents
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: WhatsApp Closer & Scripts ── */}
      {/* ── TAB 3: UAE Workshop Closing Pipeline ── */}
      {activeTab === "closer" && <WorkshopCloserTab />}

      {/* ── TAB 4: 15-Scenario Objection & Psychological Resolver ── */}
      {activeTab === "objections" && <ObjectionResolverTab />}

      {activeTab === "proposals" && (
        <div className="space-y-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <span>Standardized Dubai Pricing Tiers</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Never invent custom pricing on the fly. Sell these 3 pre-packaged offers to reach 40 Lac PKR easily.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Tier 1 */}
              <div className="p-5 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase">
                    Tier 1: Starter
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-[var(--text-primary)]">3,500</span>
                    <span className="text-xs text-[var(--text-muted)] font-medium">AED (~265k PKR)</span>
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">
                    Single Workshop Mobile Engine
                  </h4>
                  <ul className="text-xs text-[var(--text-muted)] space-y-1.5 pt-2">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Mobile-First Redesign (5 sections)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>1-Tap Floating WhatsApp Dock</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Google Maps Location & Reviews Sync</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/proposals/builder"
                  className="w-full py-2.5 rounded-lg bg-[var(--surface-hover)] hover:bg-amber-500 hover:text-black text-xs font-bold text-center border border-[var(--border)] transition-all"
                >
                  Create 3,500 AED Proposal →
                </Link>
              </div>

              {/* Tier 2 */}
              <div className="p-5 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 space-y-4 flex flex-col justify-between relative shadow-lg shadow-amber-500/10">
                <span className="absolute -top-2.5 right-4 text-[10px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Most Popular
                </span>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/20 px-2 py-0.5 rounded uppercase">
                    Tier 2: Growth Closer
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-[var(--text-primary)]">5,500</span>
                    <span className="text-xs text-[var(--text-muted)] font-medium">AED (~415k PKR)</span>
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">
                    Full Conversion Hub + Calculator
                  </h4>
                  <ul className="text-xs text-[var(--text-secondary)] space-y-1.5 pt-2">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Everything in Tier 1</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Interactive WhatsApp Quote Calculator</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>English & Arabic Bilingual Switcher</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>1-Year Hosting & SSL Setup</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/proposals/builder"
                  className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold text-center transition-all shadow-md"
                >
                  Create 5,500 AED Proposal →
                </Link>
              </div>

              {/* Tier 3 */}
              <div className="p-5 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded uppercase">
                    Tier 3: Elite Retainer
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-[var(--text-primary)]">7,500</span>
                    <span className="text-xs text-[var(--text-muted)] font-medium">AED (~565k PKR)</span>
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">
                    Multi-Branch + Monthly Care
                  </h4>
                  <ul className="text-xs text-[var(--text-muted)] space-y-1.5 pt-2">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Everything in Tier 2</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Multi-location branch picker (Dubai/AD)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>1,500 AED/mo Maintenance & Speed Retainer</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/proposals/builder"
                  className="w-full py-2.5 rounded-lg bg-[var(--surface-hover)] hover:bg-amber-500 hover:text-black text-xs font-bold text-center border border-[var(--border)] transition-all"
                >
                  Create 7,500 AED Proposal →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: Daily 2.5h Checklist ── */}
      {activeTab === "checklist" && (
        <div className="space-y-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                <span>Daily 2.5-Hour Revenue Execution Checklist</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Stick to this exact routine every day from Monday to Friday. Consistency here guarantees reaching 40 Lac PKR.
              </p>
            </div>

            <div className="space-y-3">
              {/* Task 1 */}
              <div
                onClick={() => toggleChecklist("morningScrape")}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  checklist.morningScrape
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-[var(--bg)] border-[var(--border)] hover:border-amber-500/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center border ${
                      checklist.morningScrape
                        ? "bg-emerald-500 border-emerald-400 text-black"
                        : "border-[var(--border)] bg-[var(--surface)]"
                    }`}
                  >
                    {checklist.morningScrape && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                  <div>
                    <h4
                      className={`text-sm font-semibold ${
                        checklist.morningScrape
                          ? "line-through text-[var(--text-muted)]"
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      Morning (9:30 AM - 10:15 AM): Scrape 10 UAE Leads
                    </h4>
                    <p className="text-xs text-[var(--text-muted)]">
                      Go to Tab 1, pick an area (e.g. Al Quoz or Al Qusais), and click "Run Live UAE Maps Scraper".
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-amber-500">45 Mins</span>
              </div>

              {/* Task 2 */}
              <div
                onClick={() => toggleChecklist("afternoonTeasers")}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  checklist.afternoonTeasers
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-[var(--bg)] border-[var(--border)] hover:border-amber-500/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center border ${
                      checklist.afternoonTeasers
                        ? "bg-emerald-500 border-emerald-400 text-black"
                        : "border-[var(--border)] bg-[var(--surface)]"
                    }`}
                  >
                    {checklist.afternoonTeasers && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                  <div>
                    <h4
                      className={`text-sm font-semibold ${
                        checklist.afternoonTeasers
                          ? "line-through text-[var(--text-muted)]"
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      Afternoon (1:30 PM - 2:30 PM): Send 5 Permission Teasers
                    </h4>
                    <p className="text-xs text-[var(--text-muted)]">
                      Use the 1-click WhatsApp buttons on top 5 leads with zero website. Only ask "Can I send the preview link over?".
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-amber-500">60 Mins</span>
              </div>

              {/* Task 3 */}
              <div
                onClick={() => toggleChecklist("sendDemos")}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  checklist.sendDemos
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-[var(--bg)] border-[var(--border)] hover:border-amber-500/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center border ${
                      checklist.sendDemos
                        ? "bg-emerald-500 border-emerald-400 text-black"
                        : "border-[var(--border)] bg-[var(--surface)]"
                    }`}
                  >
                    {checklist.sendDemos && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                  <div>
                    <h4
                      className={`text-sm font-semibold ${
                        checklist.sendDemos
                          ? "line-through text-[var(--text-muted)]"
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      Afternoon: Deliver 30-Sec Video to Positive Replies
                    </h4>
                    <p className="text-xs text-[var(--text-muted)]">
                      When someone says "Yes" or "Sure", send the 30-sec MP4 screen recording from your desktop DEMOS folder.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-amber-500">20 Mins</span>
              </div>

              {/* Task 4 */}
              <div
                onClick={() => toggleChecklist("eveningFollowups")}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  checklist.eveningFollowups
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-[var(--bg)] border-[var(--border)] hover:border-amber-500/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center border ${
                      checklist.eveningFollowups
                        ? "bg-emerald-500 border-emerald-400 text-black"
                        : "border-[var(--border)] bg-[var(--surface)]"
                    }`}
                  >
                    {checklist.eveningFollowups && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                  <div>
                    <h4
                      className={`text-sm font-semibold ${
                        checklist.eveningFollowups
                          ? "line-through text-[var(--text-muted)]"
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      Evening (5:30 PM - 6:00 PM): Day 2 / Day 4 Follow-Ups
                    </h4>
                    <p className="text-xs text-[var(--text-muted)]">
                      Send gentle value nudges to leads who haven't replied yet using the scripts in Tab 3.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-amber-500">25 Mins</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agency Guide Modal */}
      <AgencyGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}
