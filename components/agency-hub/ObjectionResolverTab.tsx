"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Send,
  Copy,
  Check,
  Flame,
  Search,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Phone,
  User,
  Eye,
  Clock,
  Ghost,
  DollarSign,
  TrendingDown,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { getAllObjections, getObjectionScript, generateWhatsAppUrl } from "@/lib/closing-engine/templateEngine";

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
}

export function ObjectionResolverTab() {
  const [leads, setLeads] = useState<WorkshopLead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedObjectionId, setSelectedObjectionId] = useState<string>("replied_hi_hello");
  const [copied, setCopied] = useState(false);
  const [searchLead, setSearchLead] = useState("");

  const allObjections = getAllObjections();

  // Load leads
  useEffect(() => {
    fetch("/api/closing-engine/leads")
      .then((r) => r.json())
      .then((data) => {
        if (data.leads && Array.isArray(data.leads)) {
          setLeads(data.leads);
          if (data.leads.length > 0 && !selectedLeadId) {
            setSelectedLeadId(data.leads[0].id);
          }
        }
      })
      .catch((e) => console.error("Failed to load leads for objections:", e));
  }, []);

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || leads[0];

  const currentScript = selectedLead
    ? getObjectionScript(selectedObjectionId, {
        id: selectedLead.id,
        businessName: selectedLead.businessName,
        ownerName: selectedLead.ownerName,
        location: selectedLead.location,
        phone: selectedLead.phone,
        email: selectedLead.email,
        currentWebsite: selectedLead.currentWebsite,
        demoLink: selectedLead.demoLink,
        pitchType: selectedLead.pitchType,
        stage: selectedLead.stage,
      })
    : null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categories = [
    {
      title: "🔥 Inbound & Engagement (Replied / In Conversation)",
      ids: ["replied_hi_hello", "uae_case_study", "send_details"],
    },
    {
      title: "👁️ Unresponsive & Ghosting Protocols",
      ids: ["seen_no_reply", "unseen_grey_ticks", "ghosted_after_demo", "final_breakup_takeaway", "ghosted"],
    },
    {
      title: "🛡️ Hard Objections & Ego Pushbacks",
      ids: [
        "site_is_good_argument",
        "price_high",
        "have_web_guy",
        "enough_business",
        "only_instagram",
        "word_of_mouth",
        "not_interested",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <span>15-Scenario Objection & Psychological Resolver</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Battle-tested responses based on Alex Hormozi price anchoring, Coach Animesh ego preservation, and UAE garage dynamics.
          </p>
        </div>

        {/* Lead Selector Pill */}
        {selectedLead && (
          <div className="flex items-center gap-2 bg-[var(--background)] px-3 py-1.5 rounded-xl border border-[var(--border)]">
            <span className="text-[11px] text-[var(--text-muted)]">Active Workshop:</span>
            <span className="text-xs font-bold text-amber-500">{selectedLead.businessName}</span>
            <span className="text-[11px] text-emerald-400 font-mono">({selectedLead.phone || "No phone"})</span>
          </div>
        )}
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 15 Scenarios Menu (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Workshop Switcher Dropdown */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Select Workshop to Personalize For:
              </label>
              <select
                value={selectedLeadId || ""}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-semibold focus:outline-none focus:border-amber-500"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.businessName} ({l.location.split(",")[0]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Categorized Scenarios Accordion / List */}
          <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
            {categories.map((cat, cIdx) => (
              <div key={cIdx} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 space-y-2">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block pb-1 border-b border-[var(--border)]">
                  {cat.title}
                </span>

                <div className="space-y-1.5 pt-1">
                  {cat.ids.map((id) => {
                    const obj = allObjections.find((o: any) => o.id === id);
                    if (!obj) return null;
                    const isSelected = selectedObjectionId === id;

                    return (
                      <button
                        key={id}
                        onClick={() => setSelectedObjectionId(id)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-amber-500 text-black font-bold shadow-sm"
                            : "bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] hover:border-amber-500/40"
                        }`}
                      >
                        <span className="truncate">{obj.title}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Generated Psychological Counter (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {currentScript && selectedLead ? (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-6">
              {/* Header */}
              <div className="pb-4 border-b border-[var(--border)] space-y-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {currentScript.category}
                </span>
                <h3 className="text-base font-bold text-[var(--text-primary)] mt-1">
                  {currentScript.title}
                </h3>
                <p className="text-xs text-amber-400/90 flex items-center gap-1.5 pt-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{currentScript.psychology}</span>
                </p>
              </div>

              {/* WhatsApp Response Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Instant Response (Personalized for {selectedLead.businessName})</span>
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {currentScript.timingTip}
                  </span>
                </div>

                <div className="rounded-xl bg-[var(--background)] border border-[var(--border)] p-4">
                  <pre className="text-xs text-[var(--text-primary)] whitespace-pre-wrap font-sans leading-relaxed">
                    {currentScript.whatsapp}
                  </pre>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(currentScript.whatsapp)}
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
                        <span>Copy WhatsApp Script</span>
                      </>
                    )}
                  </button>

                  {selectedLead.phone && (
                    <a
                      href={generateWhatsAppUrl(selectedLead.phone, currentScript.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-2 transition-all shadow-md"
                    >
                      <Send className="w-4 h-4" />
                      <span>Open WhatsApp & Reply</span>
                    </a>
                  )}
                </div>

                {selectedLead.demoLink && (
                  <a
                    href={selectedLead.demoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/10 flex items-center gap-1.5 transition-all"
                  >
                    <span>Check Base44 Demo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Cold Email Alternative */}
              {currentScript.email && (
                <div className="space-y-2 pt-4 border-t border-[var(--border)]">
                  <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Backup Email Response (if client prefers email)
                  </span>
                  <div className="rounded-xl bg-[var(--background)] border border-[var(--border)] p-4">
                    <pre className="text-xs text-[var(--text-muted)] whitespace-pre-wrap font-sans leading-relaxed">
                      {currentScript.email}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[var(--text-muted)]">
              Select an objection scenario from the left to view response.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
