"use client";

import React, { useState } from "react";
import {
  Sparkles,
  X,
  Target,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Copy,
  Check,
  ArrowRight,
  Flame,
  Clock,
  Briefcase
} from "lucide-react";

interface AgencyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgencyGuideModal({ isOpen, onClose }: AgencyGuideModalProps) {
  const [activeTab, setActiveTab] = useState<"actions" | "objections" | "qa" | "tracker">("actions");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                Agency Copilot & Chief of Staff
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  Always-On Guide
                </span>
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Guiding you step-by-step to close 40 Lac PKR (52,500 AED) in 60 Days
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-[var(--bg)] border-b border-[var(--border)] overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab("actions")}
            className={`px-3 py-2 rounded-lg font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "actions"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Target className="w-3.5 h-3.5" /> What To Do Today?
          </button>
          <button
            onClick={() => setActiveTab("objections")}
            className={`px-3 py-2 rounded-lg font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "objections"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Objections & Ghosting
          </button>
          <button
            onClick={() => setActiveTab("qa")}
            className={`px-3 py-2 rounded-lg font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "qa"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Demo Quality Check
          </button>
          <button
            onClick={() => setActiveTab("tracker")}
            className={`px-3 py-2 rounded-lg font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "tracker"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> 40 Lac Target Tracker
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: DAILY ACTIONS (PROJECT SHEPHERD) */}
          {activeTab === "actions" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                <span className="font-bold">🎯 Your Non-Negotiable 3 Daily Actions:</span> You only need 11 clients in 60 days to hit 40 Lac PKR. Follow this 2.5-hour rhythm:
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] flex gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500 text-slate-950 font-bold flex items-center justify-center shrink-0">1</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-[var(--text-primary)] text-sm">Morning (10:00 - 10:30 AM): Send 10 WhatsApp Teasers</h4>
                    <p className="text-[var(--text-muted)]">
                      Do NOT build a website yet! Just use Apify scraper to pull 10 businesses, copy the Permission Teaser, and send via WhatsApp. Goal: Get 2 people to say "Sure / send it".
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] flex gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500 text-white font-bold flex items-center justify-center shrink-0">2</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-[var(--text-primary)] text-sm">Midday (1:00 - 2:00 PM): Deliver Demos to the "Yes" Leads</h4>
                    <p className="text-[var(--text-muted)]">
                      For the 1-2 owners who replied "ok": Run Base44/Vercel demo generator (15 mins), record a 40-sec mobile screen walkthrough, and deliver.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] flex gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shrink-0">3</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-[var(--text-primary)] text-sm">Afternoon (4:30 - 5:00 PM): Execute Follow-Up Cadence</h4>
                    <p className="text-[var(--text-muted)]">
                      Check your queue. Send the Day 2 Mobile Check or Day 8 Break-up message to older leads who went quiet.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OBJECTIONS & GHOSTING (CLOSER) */}
          {activeTab === "objections" && (
            <div className="space-y-4">
              {/* Objection 1 */}
              <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400">Client asks: "How much does this cost?"</span>
                  <button
                    onClick={() => copyToClipboard(`Full custom builds in Dubai usually run 6,000 to 8,000 AED.\n\nHowever, because I already built your custom design foundation on our staging server, I can connect your official domain, hook up your WhatsApp booking, and launch everything live for just 3,500 AED with zero downtime.\n\nCan have it live by Friday. Should I send over the launch checklist?`, "pricing")}
                    className="px-2.5 py-1 rounded bg-[var(--bg)] border border-[var(--border)] hover:border-cyan-500 text-[var(--text-primary)] flex items-center gap-1 font-semibold"
                  >
                    {copiedKey === "pricing" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedKey === "pricing" ? "Copied" : "Copy Script"}
                  </button>
                </div>
                <p className="text-[var(--text-muted)] leading-relaxed italic pl-3 border-l-2 border-amber-400">
                  "Full custom builds in Dubai usually run 6,000 to 8,000 AED. However, because I already built your foundation, I can launch everything on your official domain for just 3,500 AED with zero downtime..."
                </p>
              </div>

              {/* Objection 2: Ghosting / No Reply */}
              <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-400">Client saw demo but stopped replying (Day 8 Break-Up)</span>
                  <button
                    onClick={() => copyToClipboard(`Hi [Name], I haven't heard back, so I assume updating your website isn't a priority right now—which is completely fine!\n\nI'm closing out our schedule for this week's website deployments in [Area]. If you decide down the road you want to modernize [Business Name]'s online bookings, feel free to reach out anytime.\n\nWishing you and the team continued success!`, "breakup")}
                    className="px-2.5 py-1 rounded bg-[var(--bg)] border border-[var(--border)] hover:border-cyan-500 text-[var(--text-primary)] flex items-center gap-1 font-semibold"
                  >
                    {copiedKey === "breakup" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedKey === "breakup" ? "Copied" : "Copy Script"}
                  </button>
                </div>
                <p className="text-[var(--text-muted)] leading-relaxed italic pl-3 border-l-2 border-rose-400">
                  "Hi [Name], I haven't heard back, so I assume updating your website isn't a priority right now—completely fine! I'm closing out our schedule for this week..." (Psychology: Triggers fear of missing out).
                </p>
              </div>

              {/* Objection 3 */}
              <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-400">Client says: "We already have an IT guy / agency"</span>
                  <button
                    onClick={() => copyToClipboard(`Totally respect that! Most established businesses do.\n\nThe reason I reached out is because your current live layout doesn't have an instant 1-tap WhatsApp booking flow for mobile drivers, so you are losing inquiries.\n\nIf your current IT team is busy with internal tasks, I can handle the complete redesign and handover the clean code to them directly. Takes zero effort from your side!`, "itguy")}
                    className="px-2.5 py-1 rounded bg-[var(--bg)] border border-[var(--border)] hover:border-cyan-500 text-[var(--text-primary)] flex items-center gap-1 font-semibold"
                  >
                    {copiedKey === "itguy" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedKey === "itguy" ? "Copied" : "Copy Script"}
                  </button>
                </div>
                <p className="text-[var(--text-muted)] leading-relaxed italic pl-3 border-l-2 border-cyan-400">
                  "Totally respect that! If your IT team is busy, I can handle the redesign and handover the clean code to them directly. Zero effort from your side."
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: QA REALITY CHECKER (TESTING) */}
          {activeTab === "qa" && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
                <span className="font-bold">🛡️ Reality Checker 5-Point Rule:</span> Never send a demo link to a UAE business owner before checking these 5 points on your phone:
              </div>

              <div className="space-y-2.5">
                {[
                  { title: "1-Tap WhatsApp Floating Dock", desc: "Is there a persistent WhatsApp button fixed at the screen bottom that works on iPhone?" },
                  { title: "No Pinch-to-Zoom Needed", desc: "All fonts and buttons must be large, clean, and app-like on mobile (Plus Jakarta Sans)." },
                  { title: "Real Dubai Details Injected", desc: "Correct warehouse/area address, verified Google review count, and real workshop photos/services." },
                  { title: "Instant Estimate Tool Tested", desc: "Does selecting AC/Brakes in the calculator generate a clean pre-filled WhatsApp message?" },
                  { title: "0.8s Instant Load", desc: "Ensure no heavy uncompressed images (>1MB) freeze the page on mobile 4G." }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] flex items-start gap-3">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-[var(--text-primary)]">{item.title}</div>
                      <div className="text-[var(--text-muted)] text-[11px] mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: 40 LAC TARGET TRACKER (FINANCE & SUPPORT) */}
          {activeTab === "tracker" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-emerald-500/20 border border-[var(--border)]">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-[var(--text-primary)]">60-Day Goal Progress</span>
                  <span className="font-extrabold text-cyan-400">40 Lac PKR (~52,500 AED)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-[var(--bg)] overflow-hidden p-0.5 border border-[var(--border)]">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: "15%" }} />
                </div>
                <div className="flex justify-between text-[11px] text-[var(--text-muted)] mt-1.5">
                  <span>Current Closed: 0 / 11 Clients</span>
                  <span>Required: ~1.4 Closes / Week</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-center">
                  <div className="text-lg font-bold text-cyan-400">4 Deals</div>
                  <div className="text-[11px] text-[var(--text-primary)] font-semibold mt-0.5">Rapid Mobile Revamp</div>
                  <div className="text-[10px] text-[var(--text-muted)]">3,500 AED each</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-center">
                  <div className="text-lg font-bold text-purple-400">5 Deals</div>
                  <div className="text-[11px] text-[var(--text-primary)] font-semibold mt-0.5">Full Studio Flagship</div>
                  <div className="text-[10px] text-[var(--text-muted)]">5,500 AED each</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-center">
                  <div className="text-lg font-bold text-emerald-400">2 Deals</div>
                  <div className="text-[11px] text-[var(--text-primary)] font-semibold mt-0.5">VIP Bilingual + Retainer</div>
                  <div className="text-[10px] text-[var(--text-muted)]">7,500 AED each</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-[var(--border)] bg-[var(--bg)] flex items-center justify-between text-xs">
          <span className="text-[var(--text-muted)]">Need custom guidance? Ask in Antigravity chat anytime!</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition shadow-md shadow-cyan-500/20"
          >
            Got It, Let's Execute!
          </button>
        </div>
      </div>
    </div>
  );
}
