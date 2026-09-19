"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  ShieldCheck,
  Lock,
  Save,
  Loader2,
  CheckCircle2,
  Clock,
  Target,
  MessageSquare,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { GateBadge } from "@/components/ui/GateBadge";
import { useBusinessBrain } from "@/context/BusinessBrainContext";

export default function SettingsPage() {
  const { setActiveEntity } = useBusinessBrain();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [dailyQuota, setDailyQuota] = useState(3);
  const [cadenceDays, setCadenceDays] = useState(4);
  const [tonePreference, setTonePreference] = useState("Professional, concise, and value-oriented");
  const [whatsappTemplate, setWhatsappTemplate] = useState(
    "Hi {{name}}, noticed your work in {{industry}}. We help businesses streamline operations and convert more leads. Would you be open to a quick 5-min intro?"
  );
  const [emailTemplate, setEmailTemplate] = useState(
    "Hi {{name}},\n\nI was looking at {{business_name}} and noticed an opportunity to improve lead conversion. Are you available for a brief chat this week?"
  );
  const [defaultTerms, setDefaultTerms] = useState(
    "50% advance upon invoice issuance. 50% upon final delivery. Standard 2 rounds of review included."
  );

  const [auditGates, setAuditGates] = useState<any[]>([]);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const json = await res.json();
          const s = json.settings;
          setDailyQuota(s.daily_target_quota || 3);
          setCadenceDays(s.follow_up_cadence_days || 4);
          setTonePreference(s.tone_preference || "");
          if (s.message_templates) {
            if (s.message_templates.whatsapp) setWhatsappTemplate(s.message_templates.whatsapp);
            if (s.message_templates.email) setEmailTemplate(s.message_templates.email);
          }
          if (s.proposal_templates?.default_terms) {
            setDefaultTerms(s.proposal_templates.default_terms);
          }
          setAuditGates(json.hard_gates_audit || []);

          setActiveEntity({
            type: "general",
            name: "System Settings",
            data: s,
          });
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daily_target_quota: dailyQuota,
          follow_up_cadence_days: cadenceDays,
          tone_preference: tonePreference,
          message_templates: {
            whatsapp: whatsappTemplate,
            email: emailTemplate,
          },
          proposal_templates: {
            default_terms: defaultTerms,
          },
        }),
      });
      if (res.ok) {
        setSuccessMsg("Settings updated successfully.");
        setTimeout(() => setSuccessMsg(""), 3500);
      }
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
        <p className="text-xs text-[var(--text-muted)]">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-[var(--border)]">
        <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] tracking-tight flex items-center gap-2">
          <span>S12 — System Settings &amp; Approval Gates</span>
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Configure cadence parameters, AI starting templates, and audit active hard approval guardrails.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-lg bg-[var(--success-soft)] border border-[var(--success-border)] text-[var(--success)] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SECTION 1: Approval Gate Safety Log (Read-only) */}
      <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[var(--success)]" />
            <h2 className="text-sm font-semibold font-heading text-[var(--text-primary)]">
              Approval Gate Safety Log (Permanent Enforcements)
            </h2>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)] font-bold uppercase">
            IMMUTABLE
          </span>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          In accordance with the ClientPulse core security philosophy, these 5 gates are hard-coded at the API and database levels. They <strong>cannot be toggled off or bypassed</strong> by AI or background jobs.
        </p>

        <div className="space-y-2">
          {[
            {
              gate: 1,
              title: "Gate 1: Outbound Message Confirmation",
              rule: "AI outreach text is generated in draft state. It can only transition to sent via explicit human click after manual delivery.",
            },
            {
              gate: 2,
              title: "Gate 2: Proposal Explicit Approval",
              rule: "Generating PDF and moving proposal to approved requires an explicit user approval action.",
            },
            {
              gate: 3,
              title: "Gate 3: Proposal Sent Confirmation",
              rule: "Proposal status cannot transition to Sent until Gate 2 approval timestamp exists.",
            },
            {
              gate: 4,
              title: "Gate 4: Invoice Sent Confirmation",
              rule: "Invoice dispatch requires user confirmation.",
            },
            {
              gate: 5,
              title: "Gate 5: Payment Received Confirmation",
              rule: "Payment confirmation is strictly manual; never inferred or auto-set. Triggering Gate 5 is the sole allowed automated initiator for Onboarding.",
            },
          ].map((g) => (
            <div
              key={g.gate}
              className="p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] flex items-start justify-between gap-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <GateBadge gateNumber={g.gate as any} isUnlocked={true} label={`GATE ${g.gate}`} />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{g.title}</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] pl-1 leading-relaxed">{g.rule}</p>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-[var(--success)] font-mono bg-[var(--success-soft)] px-2 py-0.5 rounded border border-[var(--success-border)]">
                <Lock className="w-3 h-3" />
                <span>LOCKED</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Configurable Parameters */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Daily Quota & Cadence */}
        <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
          <h2 className="text-sm font-semibold font-heading text-[var(--text-primary)] flex items-center gap-2">
            <Target className="w-4 h-4 text-[var(--accent)]" />
            <span>Daily Quota &amp; Follow-up Rules</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                Daily Focus Target Quota (Default: 3)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={dailyQuota}
                onChange={(e) => setDailyQuota(parseInt(e.target.value) || 3)}
                className="w-full bg-[var(--surface-hover)] border border-[var(--border-hover)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
              <p className="text-[11px] text-[var(--text-dim)]">
                Caps how many active leads can be flagged as today&apos;s priority targets simultaneously.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                Follow-up Cadence (Days Without Reply)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={cadenceDays}
                onChange={(e) => setCadenceDays(parseInt(e.target.value) || 4)}
                className="w-full bg-[var(--surface-hover)] border border-[var(--border-hover)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
              <p className="text-[11px] text-[var(--text-dim)]">
                Number of days of client silence before the system automatically flags a follow-up task.
              </p>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-medium text-[var(--text-secondary)]">AI Tone Preference</label>
            <input
              type="text"
              value={tonePreference}
              onChange={(e) => setTonePreference(e.target.value)}
              className="w-full bg-[var(--surface-hover)] border border-[var(--border-hover)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Templates */}
        <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
          <h2 className="text-sm font-semibold font-heading text-[var(--text-primary)] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[var(--accent)]" />
            <span>AI Starting Templates</span>
          </h2>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)]">WhatsApp Outreach Template</label>
              <textarea
                rows={3}
                value={whatsappTemplate}
                onChange={(e) => setWhatsappTemplate(e.target.value)}
                className="w-full bg-[var(--surface-hover)] border border-[var(--border-hover)] rounded-lg p-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] font-mono text-[11px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Email Outreach Template</label>
              <textarea
                rows={4}
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
                className="w-full bg-[var(--surface-hover)] border border-[var(--border-hover)] rounded-lg p-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] font-mono text-[11px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Default Proposal Terms</label>
              <input
                type="text"
                value={defaultTerms}
                onChange={(e) => setDefaultTerms(e.target.value)}
                className="w-full bg-[var(--surface-hover)] border border-[var(--border-hover)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
