"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Users,
  Briefcase,
  FileText,
  Receipt,
  MessageSquare,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface SearchResults {
  clients: Array<{ id: string; business_name: string; stage: string; payment_status: string; url?: string }>;
  leads: Array<{ id: string; business_name: string; status: string; city_country?: string; url?: string }>;
  proposals: Array<{
    id: string;
    proposal_number?: string;
    client_name: string;
    title?: string;
    status: string;
    total_investment: number;
    url?: string;
  }>;
  invoices: Array<{
    id: string;
    invoice_number: string;
    client_name: string;
    title?: string;
    amount: number;
    status: string;
    url?: string;
  }>;
  interactions: Array<{
    id: string;
    channel: string;
    content: string;
    target_name: string;
    target_type?: "Client" | "Lead";
    created_at: string;
    url?: string;
  }>;
}

interface FlatResultItem {
  id: string;
  category: "client" | "lead" | "proposal" | "invoice" | "interaction";
  entityTag: string;
  title: string;
  subtitle?: string;
  badge?: string;
  url: string;
}

export const GlobalSearchModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchResults>({
    clients: [],
    leads: [],
    proposals: [],
    invoices: [],
    interactions: [],
  });

  // Build ordered flat list for keyboard navigation and aria-activedescendant
  // PRIORITY ORDER: Clients -> Leads -> Proposals -> Invoices -> Interactions
  const flatItems: FlatResultItem[] = useMemo(() => {
    const list: FlatResultItem[] = [];

    // 1. Clients
    (results.clients || []).forEach((c) =>
      list.push({
        id: c.id,
        category: "client",
        entityTag: "CLIENT",
        title: c.business_name,
        subtitle: `Stage: ${c.stage} • Payment: ${c.payment_status}`,
        badge: c.stage,
        url: c.url || `/clients/${c.id}`,
      })
    );

    // 2. Leads
    (results.leads || []).forEach((l) =>
      list.push({
        id: l.id,
        category: "lead",
        entityTag: "LEAD",
        title: l.business_name,
        subtitle: l.city_country || "Location unknown",
        badge: l.status,
        url: l.url || `/leads/${l.id}`,
      })
    );

    // 3. Proposals
    (results.proposals || []).forEach((p) =>
      list.push({
        id: p.id,
        category: "proposal",
        entityTag: "PROPOSAL",
        title: p.title || `Proposal for ${p.client_name}`,
        subtitle: `$${p.total_investment?.toLocaleString() || 0} • ${p.proposal_number || ""}`,
        badge: p.status,
        url: p.url || `/proposals/builder?id=${p.id}`,
      })
    );

    // 4. Invoices
    (results.invoices || []).forEach((inv) =>
      list.push({
        id: inv.id,
        category: "invoice",
        entityTag: "INVOICE",
        title: inv.title || `${inv.invoice_number} — ${inv.client_name}`,
        subtitle: `$${inv.amount?.toLocaleString() || 0}`,
        badge: inv.status,
        url: inv.url || `/invoices/builder?id=${inv.id}`,
      })
    );

    // 5. Interactions
    (results.interactions || []).forEach((i) =>
      list.push({
        id: i.id,
        category: "interaction",
        entityTag: "INTERACTION",
        title: `${i.channel} with ${i.target_name} (${i.target_type || "Lead"})`,
        subtitle: i.content,
        badge: new Date(i.created_at).toLocaleDateString(),
        url: i.url || "#",
      })
    );

    return list;
  }, [results]);

  // Reset selected index when flat items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [flatItems.length]);

  // Global keydown: Ctrl+K / Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Fetch search query
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ clients: [], leads: [], proposals: [], invoices: [], interactions: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults({
            clients: data.clients || [],
            leads: data.leads || [],
            proposals: data.proposals || [],
            invoices: data.invoices || [],
            interactions: data.interactions || [],
          });
        }
      } catch (err) {
        console.error("Search fetch failed", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    if (!path || path === "#") return;
    onClose();
    setQuery("");
    router.push(path);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (flatItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % flatItems.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flatItems.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems.length > 0 && flatItems[selectedIndex]) {
        navigateTo(flatItems[selectedIndex].url);
      }
    }
  };

  const hasAnyResults = flatItems.length > 0;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/75 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
          <Search className="w-5 h-5 text-[var(--text-muted)] mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search clients, leads, proposals, invoices, messages... (Ctrl+K)"
            className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-[var(--text-dim)] text-base"
          />
          {loading && <Loader2 className="w-4 h-4 text-[var(--accent)] animate-spin mr-2 flex-shrink-0" />}
          <button
            onClick={onClose}
            aria-label="Close search modal"
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--surface-hover)] transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6" role="listbox">
          {!query && (
            <div className="text-center py-8 text-[var(--text-dim)] text-sm">
              Type at least 2 characters to search across all records...
            </div>
          )}

          {query && !loading && !hasAnyResults && (
            <div className="text-center py-8 text-[var(--text-dim)] text-sm">
              No matching records found for &quot;{query}&quot;
            </div>
          )}

          {/* 1. Group: Clients (Top Priority) */}
          {results.clients && results.clients.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                <span>Clients ({results.clients.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.clients.map((client) => {
                  const itemIndex = flatItems.findIndex((i) => i.id === client.id && i.category === "client");
                  const isSelected = selectedIndex === itemIndex;
                  const itemUrl = client.url || `/clients/${client.id}`;
                  return (
                    <button
                      key={client.id}
                      type="button"
                      role="option"
                      aria-label={`Client record: ${client.business_name}`}
                      aria-selected={isSelected}
                      tabIndex={0}
                      onClick={() => navigateTo(itemUrl)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigateTo(itemUrl);
                        }
                      }}
                      className={`w-full text-left flex items-center justify-between p-2.5 rounded-lg border transition-all group cursor-pointer ${
                        isSelected
                          ? "bg-[var(--surface-raised)] border-emerald-500 shadow-sm"
                          : "bg-[var(--surface-hover)] border-transparent hover:bg-[var(--surface-raised)] hover:border-emerald-500/40"
                      }`}
                    >
                      <div className="space-y-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider shrink-0">
                            CLIENT
                          </span>
                          <span className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors truncate">
                            {client.business_name}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--text-dim)] pl-0.5">
                          Stage: {client.stage} • Payment: {client.payment_status}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          {client.stage}
                        </span>
                        <ArrowRight className="w-4 h-4 text-[var(--text-dim)] group-hover:text-emerald-400 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Group: Leads */}
          {results.leads && results.leads.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Leads ({results.leads.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.leads.map((lead) => {
                  const itemIndex = flatItems.findIndex((i) => i.id === lead.id && i.category === "lead");
                  const isSelected = selectedIndex === itemIndex;
                  const itemUrl = lead.url || `/leads/${lead.id}`;
                  return (
                    <button
                      key={lead.id}
                      type="button"
                      role="option"
                      aria-label={`Lead record: ${lead.business_name}`}
                      aria-selected={isSelected}
                      tabIndex={0}
                      onClick={() => navigateTo(itemUrl)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigateTo(itemUrl);
                        }
                      }}
                      className={`w-full text-left flex items-center justify-between p-2.5 rounded-lg border transition-all group cursor-pointer ${
                        isSelected
                          ? "bg-[var(--surface-raised)] border-blue-500 shadow-sm"
                          : "bg-[var(--surface-hover)] border-transparent hover:bg-[var(--surface-raised)] hover:border-blue-500/40"
                      }`}
                    >
                      <div className="space-y-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider shrink-0">
                            LEAD
                          </span>
                          <span className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-blue-400 transition-colors truncate">
                            {lead.business_name}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--text-dim)] pl-0.5">
                          {lead.city_country || "Location unknown"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]">
                          {lead.status}
                        </span>
                        <ArrowRight className="w-4 h-4 text-[var(--text-dim)] group-hover:text-blue-400 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Group: Proposals */}
          {results.proposals && results.proposals.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>Proposals ({results.proposals.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.proposals.map((p) => {
                  const itemIndex = flatItems.findIndex((i) => i.id === p.id && i.category === "proposal");
                  const isSelected = selectedIndex === itemIndex;
                  const itemUrl = p.url || `/proposals/builder?id=${p.id}`;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="option"
                      aria-label={`Proposal: ${p.title || p.client_name}`}
                      aria-selected={isSelected}
                      tabIndex={0}
                      onClick={() => navigateTo(itemUrl)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigateTo(itemUrl);
                        }
                      }}
                      className={`w-full text-left flex items-center justify-between p-2.5 rounded-lg border transition-all group cursor-pointer ${
                        isSelected
                          ? "bg-[var(--surface-raised)] border-purple-500 shadow-sm"
                          : "bg-[var(--surface-hover)] border-transparent hover:bg-[var(--surface-raised)] hover:border-purple-500/40"
                      }`}
                    >
                      <div className="space-y-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase tracking-wider shrink-0">
                            PROPOSAL
                          </span>
                          <span className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-purple-400 transition-colors truncate">
                            {p.title || `Proposal for ${p.client_name}`}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--text-dim)] pl-0.5">
                          ${p.total_investment?.toLocaleString() || 0} {p.proposal_number ? `• ${p.proposal_number}` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]">
                          {p.status}
                        </span>
                        <ArrowRight className="w-4 h-4 text-[var(--text-dim)] group-hover:text-purple-400 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Group: Invoices */}
          {results.invoices && results.invoices.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                <span>Invoices ({results.invoices.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.invoices.map((inv) => {
                  const itemIndex = flatItems.findIndex((i) => i.id === inv.id && i.category === "invoice");
                  const isSelected = selectedIndex === itemIndex;
                  const itemUrl = inv.url || `/invoices/builder?id=${inv.id}`;
                  return (
                    <button
                      key={inv.id}
                      type="button"
                      role="option"
                      aria-label={`Invoice: ${inv.invoice_number}`}
                      aria-selected={isSelected}
                      tabIndex={0}
                      onClick={() => navigateTo(itemUrl)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigateTo(itemUrl);
                        }
                      }}
                      className={`w-full text-left flex items-center justify-between p-2.5 rounded-lg border transition-all group cursor-pointer ${
                        isSelected
                          ? "bg-[var(--surface-raised)] border-amber-500 shadow-sm"
                          : "bg-[var(--surface-hover)] border-transparent hover:bg-[var(--surface-raised)] hover:border-amber-500/40"
                      }`}
                    >
                      <div className="space-y-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider shrink-0">
                            INVOICE
                          </span>
                          <span className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-amber-400 transition-colors truncate">
                            {inv.title || `${inv.invoice_number} — ${inv.client_name}`}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--text-dim)] pl-0.5">
                          ${inv.amount?.toLocaleString() || 0}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]">
                          {inv.status}
                        </span>
                        <ArrowRight className="w-4 h-4 text-[var(--text-dim)] group-hover:text-amber-400 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Group: Interactions (Distinct entity tag to prevent confusion with Client records) */}
          {results.interactions && results.interactions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>Interactions &amp; Messages ({results.interactions.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.interactions.map((msg) => {
                  const itemIndex = flatItems.findIndex((i) => i.id === msg.id && i.category === "interaction");
                  const isSelected = selectedIndex === itemIndex;
                  const itemUrl = msg.url || "#";
                  const targetType = msg.target_type || "Lead";
                  return (
                    <button
                      key={msg.id}
                      type="button"
                      role="option"
                      aria-label={`Interaction message for ${targetType}: ${msg.target_name}`}
                      aria-selected={isSelected}
                      tabIndex={0}
                      onClick={() => navigateTo(itemUrl)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                        isSelected
                          ? "bg-[var(--surface-raised)] border-indigo-500 shadow-sm"
                          : "bg-[var(--surface-hover)] border-[var(--border)] hover:border-indigo-500/40"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase tracking-wider">
                            INTERACTION
                          </span>
                          <span className="font-semibold text-[var(--text-secondary)]">
                            {msg.channel} with {msg.target_name} ({targetType})
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--text-dim)]">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--text-muted)] line-clamp-2 italic mb-1.5 pl-0.5">
                        &ldquo;{msg.content}&rdquo;
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-indigo-400 font-medium pt-1 border-t border-[var(--border)]">
                        <span>Opens {targetType} Record</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
