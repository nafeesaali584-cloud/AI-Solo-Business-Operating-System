import React from "react";
import { ShieldCheck, Lock } from "lucide-react";

interface GateBadgeProps {
  gateNumber: 1 | 2 | 3 | 4 | 5;
  isUnlocked?: boolean;
  label?: string;
  className?: string;
}

export const GateBadge: React.FC<GateBadgeProps> = ({
  gateNumber,
  isUnlocked = false,
  label,
  className = "",
}) => {
  const gateDescriptions: Record<number, string> = {
    1: "Gate 1: Manual Message Sent Confirmation",
    2: "Gate 2: Proposal Explicit Approval",
    3: "Gate 3: Manual Proposal Sent Confirmation",
    4: "Gate 4: Manual Invoice Sent Confirmation",
    5: "Gate 5: Manual Payment Received Confirmation",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
        isUnlocked
          ? "bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)]"
          : "bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger-border)]"
      } ${className}`}
      title={gateDescriptions[gateNumber]}
    >
      {isUnlocked ? (
        <ShieldCheck className="w-3 h-3 text-[var(--success)]" />
      ) : (
        <Lock className="w-3 h-3 text-[var(--danger)]" />
      )}
      <span>{label || `GATE ${gateNumber}`}</span>
    </span>
  );
};
