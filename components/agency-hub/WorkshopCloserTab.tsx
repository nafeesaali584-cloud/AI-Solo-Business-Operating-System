"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Copy,
  Check,
  ExternalLink,
  Flame,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Mail,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  Globe,
  Clock,
  History,
  Phone,
  User,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import { getStageScript, generateWhatsAppUrl } from "@/lib/closing-engine/templateEngine";

interface WorkshopLead {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  location: string;
  currentWebsite: string;
  demoLink: string;
  pitchType: "redesign" | "fresh_website";
  stage: number;
  status: string;
  priority: string;
  notes: string;
  interactions: Array<{
    id: string;
    content: string;
    channel: string;
    direction: string;
    created_at: string;
  }>;
}

export function WorkshopCloserTab() {
  const [leads, setLeads] = useState<WorkshopLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"whatsapp" | "email">("whatsapp");
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch leads
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/closing-engine/leads");
      const data = await res.json();
      if (data.leads && Array.isArray(data.leads)) {
        setLeads(data.leads);
        if (data.leads.length > 0 && !selectedLeadId) {
          setSelectedLeadId(data.leads[0].id);
          setCurrentStage(data.leads[0].stage || 1);
        }
      }
    } catch (e) {
      console.error("Failed to load closing engine leads:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || leads[0];

  useEffect(() => {
    if (selectedLead) {
      setCurrentStage(selectedLead.stage || 1);
    }
  }, [selectedLeadId]);

  // Filtered leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.businessName.toLowerCase().includes(search.toLowerCase()) ||
      lead.location.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search);

    if (!matchesSearch) return false;

    if (statusFilter === "HOT") return lead.status === "In Discussion" || lead.priority === "Hottest";
    if (statusFilter === "TARGET") return lead.status === "Target Today";
    if (statusFilter === "CONTACTED") return lead.status === "Contacted";
    if (statusFilter === "OBJECTION") return lead.status === "Objection Handled";
    return true;
  });

  const generatedScript = selectedLead
    ? getStageScript(
        {
          id: selectedLead.id,
          businessName: selectedLead.businessName,
          ownerName: selectedLead.ownerName,
          location: selectedLead.location,
          phone: selectedLead.phone,
          email: selectedLead.email,
          currentWebsite: selectedLead.currentWebsite,
          demoLink: selectedLead.demoLink,
          pitchType: selectedLead.pitchType,
          stage: currentStage,
        },
        currentStage
      )
    : null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdvanceStage = async () => {
    if (!selectedLead) return;
    const nextStage = Math.min(currentStage + 1, 7);
    setIsUpdating(true);
    try {
      await fetch(`/api/closing-engine/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: nextStage,
          status: "Contacted",
          logAction: `Advanced to Stage ${nextStage}`,
          logMessage: `Sent Stage ${currentStage} message on ${new Date().toLocaleDateString()}. Moved to Stage ${nextStage}.`,
          channel: "WhatsApp",
        }),
      });
      setCurrentStage(nextStage);
      await fetchLeads();
    } catch (e) {
      console.error("Failed to advance stage:", e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogSent = async () => {
    if (!selectedLead || !generatedScript) return;
    setIsUpdating(true);
    try {
      await fetch(`/api/closing-engine/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Contacted",
          logAction: `Stage ${currentStage} dispatched`,
          logMessage: generatedScript.whatsapp.slice(0, 150) + "...",
          channel: "WhatsApp",
        }),
      });
      await fetchLeads();
      alert("Dispatched message logged into timeline!");
    } catch (e) {
      console.error("Failed to log message:", e);
    } finally {
      setIsUpdating(false);
    }
  };

  const stagesList = [
    { num: 1, label: "1. Permission-Taker" },
    { num: 2, label: "2. Demo Delivery" },
    { num: 3, label: "3. Revenue Leak" },
    { num: 4, label: "4. Local Proof (JASRAUTO)" },
    { num: 5, label: "5. Video/Voice Audit" },
    { num: 6, label: "6. Scarcity & Capacity" },
    { num: 7, label: "7. Gentle Breakup" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-500" />
            <span>UAE Workshop Closing & Follow-up Engine</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Active pipeline of {leads.length} UAE Auto Workshops with 1-tap WhatsApp deep links & Stage 1-7 psychology cadence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLeads}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Leads ({leads.length})</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Workshop Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 space-y-3">
            {/* Search & Status Filters */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search workshop name, city, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                { key: "ALL", label: `All (${leads.length})` },
                { key: "HOT", label: "🔥 Replied / Hot" },
                { key: "TARGET", label: "🎯 Target Today" },
                { key: "CONTACTED", label: "⏳ Awaiting Reply" },
                { key: "OBJECTION", label: "🛡️ Objection" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    statusFilter === f.key
                      ? "bg-amber-500 text-black font-semibold shadow-sm"
                      : "bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Leads List */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {filteredLeads.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                  No workshops match your search.
                </div>
              ) : (
                filteredLeads.map((lead) => {
                  const isSelected = selectedLead?.id === lead.id;
                  const isHot = lead.status === "In Discussion" || lead.priority === "Hottest";
                  const isObjection = lead.status === "Objection Handled";

                  return (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? "bg-amber-500/10 border-amber-500 shadow-sm"
                          : "bg-[var(--background)] border-[var(--border)] hover:border-amber-500/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-xs text-[var(--text-primary)] leading-snug">
                          {lead.businessName}
                        </div>
                        {isHot && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5" /> REPLIED
                          </span>
                        )}
                        {isObjection && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            OBJECTION
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                        <span>{lead.location.split(",")[0]}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[10px]">
                            Stage {lead.stage || 1}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                              lead.pitchType === "fresh_website"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-orange-500/20 text-orange-400"
                            }`}
                          >
                            {lead.pitchType === "fresh_website" ? "Fresh Web" : "Redesign"}
                          </span>
                        </div>
                      </div>

                      {lead.phone && (
                        <div className="text-[11px] text-[var(--text-muted)] font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-500" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Script Engine (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedLead ? (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-6">
              {/* Selected Lead Header Card */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[var(--border)]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      {selectedLead.businessName}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        selectedLead.status === "In Discussion"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {selectedLead.status}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] flex items-center gap-3">
                    <span>📍 {selectedLead.location}</span>
                    <span>👤 {selectedLead.ownerName}</span>
                    <span className="text-emerald-400 font-mono">📱 {selectedLead.phone || "No phone"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedLead.demoLink && (
                    <a
                      href={selectedLead.demoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500 hover:text-black flex items-center gap-1.5 transition-all"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Live Base44 Demo</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {selectedLead.currentWebsite && (
                    <a
                      href={selectedLead.currentWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-all"
                    >
                      <span>Old Site</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Stage Stepper (1 to 7) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Select Outreach Stage
                  </span>
                  <span className="text-xs text-amber-500 font-semibold">
                    Current Pipeline: Stage {currentStage}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
                  {stagesList.map((st) => (
                    <button
                      key={st.num}
                      onClick={() => setCurrentStage(st.num)}
                      className={`p-2 rounded-xl text-center transition-all ${
                        currentStage === st.num
                          ? "bg-amber-500 text-black font-bold shadow-md scale-105"
                          : currentStage > st.num
                          ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs"
                          : "bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs"
                      }`}
                    >
                      <div className="text-[10px] font-mono leading-none">Stage {st.num}</div>
                      <div className="text-[11px] truncate mt-0.5">
                        {st.num === 1
                          ? "Permission"
                          : st.num === 2
                          ? "Demo"
                          : st.num === 3
                          ? "Leak"
                          : st.num === 4
                          ? "Proof"
                          : st.num === 5
                          ? "Audit"
                          : st.num === 6
                          ? "Scarcity"
                          : "Breakup"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Script Box */}
              {generatedScript && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {generatedScript.title}
                      </span>
                      {generatedScript.timingTip && (
                        <span className="text-[11px] text-amber-400/90 hidden sm:inline">
                          • {generatedScript.timingTip}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 bg-[var(--surface-hover)] p-0.5 rounded-lg">
                      <button
                        onClick={() => setViewMode("whatsapp")}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                          viewMode === "whatsapp"
                            ? "bg-emerald-500 text-black font-bold shadow-sm"
                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        WhatsApp View
                      </button>
                      <button
                        onClick={() => setViewMode("email")}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                          viewMode === "email"
                            ? "bg-blue-500 text-white font-bold shadow-sm"
                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        Email View
                      </button>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="relative rounded-xl bg-[var(--background)] border border-[var(--border)] p-4">
                    {viewMode === "whatsapp" ? (
                      <pre className="text-xs text-[var(--text-primary)] whitespace-pre-wrap font-sans leading-relaxed">
                        {generatedScript.whatsapp}
                      </pre>
                    ) : (
                      <div className="space-y-3">
                        {generatedScript.emailSubject && (
                          <div className="text-xs pb-2 border-b border-[var(--border)] text-[var(--text-muted)]">
                            <strong className="text-[var(--text-primary)]">Subject:</strong>{" "}
                            {generatedScript.emailSubject}
                          </div>
                        )}
                        <pre className="text-xs text-[var(--text-primary)] whitespace-pre-wrap font-sans leading-relaxed">
                          {generatedScript.email}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleCopy(
                            viewMode === "whatsapp"
                              ? generatedScript.whatsapp
                              : generatedScript.email
                          )
                        }
                        className="px-4 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)] hover:border-amber-500 flex items-center gap-2 transition-all"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-amber-500" />
                            <span>Copy Text</span>
                          </>
                        )}
                      </button>

                      {selectedLead.phone && (
                        <a
                          href={generateWhatsAppUrl(selectedLead.phone, generatedScript.whatsapp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-2 transition-all shadow-md"
                        >
                          <Send className="w-4 h-4" />
                          <span>Open WhatsApp & Send</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleLogSent}
                        disabled={isUpdating}
                        className="px-3 py-2 rounded-xl border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-all"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Log Dispatched</span>
                      </button>

                      <button
                        onClick={handleAdvanceStage}
                        disabled={isUpdating}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                      >
                        <span>Advance to Stage {Math.min(currentStage + 1, 7)}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Interaction History Timeline */}
              {selectedLead.interactions && selectedLead.interactions.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                  <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-amber-500" />
                    <span>Recent WhatsApp Timeline ({selectedLead.interactions.length} events)</span>
                  </span>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedLead.interactions.map((event, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs flex items-start justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              event.direction === "inbound"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}
                          >
                            {event.direction === "inbound" ? "INBOUND" : "OUTBOUND"}
                          </span>
                          <p className="text-[var(--text-primary)] text-xs mt-1 leading-snug">
                            {event.content}
                          </p>
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">
                          {new Date(event.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[var(--text-muted)]">
              Select a workshop from the left column to view their pitch engine.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
