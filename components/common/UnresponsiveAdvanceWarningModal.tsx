"use client";

import React from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";

interface UnresponsiveAdvanceWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  behavior?: string | null;
  actionTitle?: string;
  actionButtonText?: string;
  isLoading?: boolean;
}

export function formatCustomerBehavior(behavior?: string | null): string {
  if (!behavior || behavior.trim() === "") return "No reply logged";
  const map: Record<string, string> = {
    warm_interested: "Warm / Interested",
    no_reply_not_seen: "No reply (not seen)",
    seen_no_reply: "Seen, no reply",
    replied_hesitant: "Replied hesitant",
    final_follow_up: "Final follow-up (unresponsive)",
    unresponsive: "Unresponsive",
  };
  return map[behavior] || behavior.replace(/_/g, " ");
}

export default function UnresponsiveAdvanceWarningModal({
  isOpen,
  onClose,
  onConfirm,
  behavior,
  actionTitle = "Proceed",
  actionButtonText = "Confirm & Proceed",
  isLoading = false,
}: UnresponsiveAdvanceWarningModalProps) {
  if (!isOpen) return null;

  const displayBehavior = formatCustomerBehavior(behavior);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--surface)] border border-amber-500/30 rounded-xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-[var(--text-primary)]">
              Advance Unresponsive Lead?
            </h2>
            <p className="text-xs text-[var(--text-dim)] mt-0.5">
              Safeguard: {actionTitle}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text-secondary)] leading-relaxed space-y-2">
          <p>
            This lead has no logged positive reply — the last recorded behavior was{" "}
            <span className="font-semibold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              '{displayBehavior}'
            </span>
            . Are you sure you want to proceed?
          </p>
          <p className="text-[11px] text-[var(--text-dim)]">
            This is a deliberate safety check to prevent accidental advancement. If you received verbal or off-platform agreement (e.g. phone call or in-person), you may safely confirm to proceed.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] text-[var(--text-secondary)] text-xs font-medium border border-[var(--border)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow transition-colors disabled:opacity-50"
          >
            <span>{actionButtonText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
