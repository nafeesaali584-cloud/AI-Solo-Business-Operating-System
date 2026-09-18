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
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 ${className}`}
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
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/60 text-amber-300 border border-amber-700/50 ${className}`}
        title="AI-generated interpretation built strictly from verified facts"
      >
        <Sparkles className="w-3 h-3 text-amber-400" />
        {label || "AI Inference"}
      </span>
    );
  }

  if (type === "web") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-950/70 text-cyan-300 border border-cyan-700/60 ${className}`}
        title="Live public data retrieved via Google Search grounding"
      >
        <Globe className="w-3 h-3 text-cyan-400" />
        {label || "Live Web Data"}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 ${className}`}
      title="Not available in source records - never guessed"
    >
      <HelpCircle className="w-3 h-3" />
      {label || "Not available"}
    </span>
  );
};
