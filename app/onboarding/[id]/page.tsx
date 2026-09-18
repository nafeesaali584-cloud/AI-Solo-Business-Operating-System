"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  CheckCircle2,
  Briefcase,
  ArrowRight,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useBusinessBrain } from "@/context/BusinessBrainContext";

interface ChecklistItem {
  id: string;
  item: string;
  status: "pending" | "done";
}

interface OnboardingRecord {
  id: string;
  client_id: string;
  checklist: ChecklistItem[];
  status: string;
  started_at: string;
  completed_at?: string | null;
  client: {
    id: string;
    business_name: string;
    stage: string;
    email?: string;
  };
}

export default function OnboardingChecklistPage() {
  const params = useParams();
  const router = useRouter();
  const onboardingId = params.id as string;
  const { setActiveEntity } = useBusinessBrain();

  const [record, setRecord] = useState<OnboardingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [customItem, setCustomItem] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchOnboarding = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/onboarding/${onboardingId}`);
      if (res.ok) {
        const json = await res.json();
        setRecord(json.onboarding);
        setActiveEntity({
          type: "client",
          id: json.onboarding.client_id,
          name: `Onboarding: ${json.onboarding.client.business_name}`,
          data: json.onboarding,
        });
      }
    } catch (err) {
      console.error("Failed to load onboarding", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (onboardingId) fetchOnboarding();
  }, [onboardingId]);

  // Toggle item done / pending
  const handleToggleItem = async (index: number) => {
    if (!record) return;
    const updatedList = [...record.checklist];
    updatedList[index].status = updatedList[index].status === "done" ? "pending" : "done";

    setRecord({ ...record, checklist: updatedList });

    try {
      await fetch(`/api/onboarding/${onboardingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist: updatedList }),
      });
    } catch (err) {
      console.error("Failed to update item", err);
    }
  };

  // Add custom item
  const handleAddCustomItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItem.trim() || !record) return;

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      item: customItem.trim(),
      status: "pending",
    };

    const updatedList = [...record.checklist, newItem];
    setRecord({ ...record, checklist: updatedList });
    setCustomItem("");

    try {
      await fetch(`/api/onboarding/${onboardingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist: updatedList }),
      });
    } catch (err) {
      console.error("Failed to add custom item", err);
    }
  };

  // Delete item
  const handleDeleteItem = async (index: number) => {
    if (!record) return;
    const updatedList = record.checklist.filter((_, i) => i !== index);
    setRecord({ ...record, checklist: updatedList });

    try {
      await fetch(`/api/onboarding/${onboardingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist: updatedList }),
      });
    } catch (err) {
      console.error("Failed to delete item", err);
    }
  };

  // Mark Onboarding Complete -> promotes Client stage to "Active"
  const handleCompleteOnboarding = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/onboarding/${onboardingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complete_onboarding: true }),
      });

      if (res.ok) {
        setMessage("🎉 Onboarding Completed! Client status is now ACTIVE.");
        setTimeout(() => {
          if (record?.client_id) router.push(`/clients/${record.client_id}`);
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to complete onboarding", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !record) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs text-zinc-400">Loading Onboarding Checklist...</p>
      </div>
    );
  }

  const completedCount = record.checklist.filter((i) => i.status === "done").length;
  const progressPercent = Math.round((completedCount / (record.checklist.length || 1)) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#202026]">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <span>S9 — Onboarding Checklist</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Post-payment setup tasks auto-created from Gate 5. Mark items done manually.
          </p>
        </div>

        <Link
          href={`/clients/${record.client_id}`}
          className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium"
        >
          <span>Client Timeline</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {message && (
        <div className="p-3.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Client Banner & Progress Meter */}
      <div className="p-5 rounded-xl bg-[#141417] border border-[#26262e] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Active Client</span>
            <h2 className="text-lg font-bold text-zinc-100">{record.client.business_name}</h2>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-emerald-400">
              {completedCount} of {record.checklist.length} Completed ({progressPercent}%)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="p-6 rounded-xl bg-[#141417] border border-[#26262e] space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200">Onboarding Items</h3>

        <div className="space-y-2">
          {record.checklist.map((item, index) => {
            const isDone = item.status === "done";
            return (
              <div
                key={item.id || index}
                onClick={() => handleToggleItem(index)}
                className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between group ${
                  isDone
                    ? "bg-[#141d17] border-emerald-900/50 text-zinc-400"
                    : "bg-[#181820] border-zinc-800 hover:border-zinc-700 text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <button className="text-emerald-400">
                    {isDone ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300" />
                    )}
                  </button>
                  <span className={`text-xs font-medium ${isDone ? "line-through text-zinc-500" : ""}`}>
                    {item.item}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteItem(index);
                  }}
                  className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Add Custom Item Form */}
        <form onSubmit={handleAddCustomItem} className="pt-3 border-t border-zinc-800 flex items-center gap-2">
          <input
            type="text"
            value={customItem}
            onChange={(e) => setCustomItem(e.target.value)}
            placeholder="Add custom onboarding task or asset requirement..."
            className="flex-1 bg-[#1b1b22] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={!customItem.trim()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#202028] hover:bg-[#2c2c38] text-zinc-200 text-xs font-semibold border border-zinc-700 disabled:opacity-50 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </form>
      </div>

      {/* Completion Action */}
      <div className="p-5 rounded-xl bg-[#16161c] border border-[#26262e] flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-zinc-200">Ready to deliver?</div>
          <p className="text-[11px] text-zinc-500">
            Completing onboarding changes the client stage to <strong>Active</strong>.
          </p>
        </div>

        <button
          onClick={handleCompleteOnboarding}
          disabled={saving || record.status === "Completed"}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{record.status === "Completed" ? "Onboarding Complete (Active)" : "Mark Onboarding Complete"}</span>
        </button>
      </div>
    </div>
  );
}
