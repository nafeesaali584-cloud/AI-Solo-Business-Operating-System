"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Users, Briefcase, FileText, Receipt, MessageSquare, ArrowRight, Loader2 } from "lucide-react";

interface SearchResults {
  leads: Array<{ id: string; business_name: string; status: string; city_country?: string }>;
  clients: Array<{ id: string; business_name: string; stage: string; payment_status: string }>;
  proposals: Array<{ id: string; client_name: string; status: string; total_investment: number }>;
  invoices: Array<{ id: string; invoice_number: string; client_name: string; amount: number; status: string }>;
  interactions: Array<{ id: string; channel: string; content: string; target_name: string; created_at: string }>;
}

export const GlobalSearchModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    leads: [],
    clients: [],
    proposals: [],
    invoices: [],
    interactions: [],
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ leads: [], clients: [], proposals: [], invoices: [], interactions: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error("Search fetch failed", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  const hasAnyResults =
    results.leads.length > 0 ||
    results.clients.length > 0 ||
    results.proposals.length > 0 ||
    results.invoices.length > 0 ||
    results.interactions.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
          <Search className="w-5 h-5 text-[var(--text-muted)] mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads, clients, proposals, invoices, messages... (Ctrl+K)"
            className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-[var(--text-dim)] text-base"
          />
          {loading && <Loader2 className="w-4 h-4 text-[var(--accent)] animate-spin mr-2" />}
          <button
            onClick={onClose}
            aria-label="Close search modal"
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--surface-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
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

          {/* Group: Leads */}
          {results.leads.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                <Users className="w-3.5 h-3.5 text-[var(--info)]" />
                Leads ({results.leads.length})
              </div>
              <div className="space-y-1.5">
                {results.leads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => navigateTo(`/leads/${lead.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] cursor-pointer border border-transparent hover:border-[var(--border-hover)] transition-colors group"
                  >
                    <div>
                      <div className="font-medium text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                        {lead.business_name}
                      </div>
                      <div className="text-xs text-[var(--text-dim)]">
                        {lead.city_country || "Location unknown"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)]">
                        {lead.status}
                      </span>
                      <ArrowRight className="w-4 h-4 text-[var(--text-dim)] group-hover:text-[var(--text-secondary)]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group: Clients */}
          {results.clients.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                <Briefcase className="w-3.5 h-3.5 text-[var(--success)]" />
                Clients ({results.clients.length})
              </div>
              <div className="space-y-1.5">
                {results.clients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => navigateTo(`/clients/${client.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] cursor-pointer border border-transparent hover:border-[var(--border-hover)] transition-colors group"
                  >
                    <div className="font-medium text-sm text-[var(--text-primary)] group-hover:text-[var(--success)] transition-colors">
                      {client.business_name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)]">
                        {client.stage}
                      </span>
                      <ArrowRight className="w-4 h-4 text-[var(--text-dim)] group-hover:text-[var(--text-secondary)]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group: Proposals */}
          {results.proposals.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />
                Proposals ({results.proposals.length})
              </div>
              <div className="space-y-1.5">
                {results.proposals.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigateTo(`/proposals/builder?id=${p.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] cursor-pointer border border-transparent hover:border-[var(--border-hover)] transition-colors group"
                  >
                    <div>
                      <div className="font-medium text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                        Proposal for {p.client_name}
                      </div>
                      <div className="text-xs text-[var(--text-dim)]">${p.total_investment}</div>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)]">
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group: Invoices */}
          {results.invoices.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                <Receipt className="w-3.5 h-3.5 text-[#a78bfa]" />
                Invoices ({results.invoices.length})
              </div>
              <div className="space-y-1.5">
                {results.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => navigateTo(`/invoices/builder?id=${inv.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] cursor-pointer border border-transparent hover:border-[var(--border-hover)] transition-colors group"
                  >
                    <div>
                      <div className="font-medium text-sm text-[var(--text-primary)] group-hover:text-[#a78bfa] transition-colors">
                        {inv.invoice_number} — {inv.client_name}
                      </div>
                      <div className="text-xs text-[var(--text-dim)]">${inv.amount}</div>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)]">
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group: Interactions */}
          {results.interactions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                <MessageSquare className="w-3.5 h-3.5 text-[var(--info)]" />
                Interactions ({results.interactions.length})
              </div>
              <div className="space-y-1.5">
                {results.interactions.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)]"
                  >
                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
                      <span className="font-semibold text-[var(--text-secondary)]">
                        {msg.channel} with {msg.target_name}
                      </span>
                      <span>{new Date(msg.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] line-clamp-2">{msg.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
