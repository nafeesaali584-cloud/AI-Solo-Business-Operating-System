import React from "react";
import { Sparkles, Database, HelpCircle, Globe } from "lucide-react";

interface FactBadgeProps {
  type: "fact" | "inference" | "web" | "unknown";
  label?: string;
  className?: string;
}

export const FactBadge: React.FC<FactBadgeProps> = ({ type, label, className = "" }) => {
  if (type === "fact") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)] ${className}`}
        title="Direct factual data from CSV/record"
      >
        <Database className="w-3 h-3" />
        {label || "Fact"}
      </span>
    );
  }

  if (type === "inference") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)] ${className}`}
        title="AI-generated interpretation built strictly from verified facts"
      >
        <Sparkles className="w-3 h-3 text-[var(--accent)]" />
        {label || "AI Inference"}
      </span>
    );
  }

  if (type === "web") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--info-soft)] text-[var(--info)] border border-[var(--info-border)] ${className}`}
        title="Live public data retrieved via Google Search grounding"
      >
        <Globe className="w-3 h-3 text-[var(--info)]" />
        {label || "Live Web Data"}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)] ${className}`}
      title="Not available in source records - never guessed"
    >
      <HelpCircle className="w-3 h-3" />
      {label || "Not available"}
    </span>
  );
};
