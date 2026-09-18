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
      <div className="w-full max-w-2xl bg-[#141417] border border-[#2a2a32] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#23232a] bg-[#17171c]">
          <Search className="w-5 h-5 text-zinc-400 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads, clients, proposals, invoices, messages... (Ctrl+K)"
            className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder-zinc-500 text-base"
          />
          {loading && <Loader2 className="w-4 h-4 text-amber-400 animate-spin mr-2" />}
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!query && (
            <div className="text-center py-8 text-zinc-500 text-sm">
              Type at least 2 characters to search across all records...
            </div>
          )}

          {query && !loading && !hasAnyResults && (
            <div className="text-center py-8 text-zinc-500 text-sm">
              No matching records found for &quot;{query}&quot;
            </div>
          )}

          {/* Group: Leads */}
          {results.leads.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Leads ({results.leads.length})
              </div>
              <div className="space-y-1.5">
                {results.leads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => navigateTo(`/leads/${lead.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#1a1a20] hover:bg-[#23232b] cursor-pointer border border-transparent hover:border-zinc-700 transition group"
                  >
                    <div>
                      <div className="font-medium text-sm text-zinc-200 group-hover:text-amber-400 transition">
                        {lead.business_name}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {lead.city_country || "Location unknown"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {lead.status}
                      </span>
                      <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group: Clients */}
          {results.clients.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                Clients ({results.clients.length})
              </div>
              <div className="space-y-1.5">
                {results.clients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => navigateTo(`/clients/${client.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#1a1a20] hover:bg-[#23232b] cursor-pointer border border-transparent hover:border-zinc-700 transition group"
                  >
                    <div className="font-medium text-sm text-zinc-200 group-hover:text-emerald-400 transition">
                      {client.business_name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                        {client.stage}
                      </span>
                      <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group: Proposals */}
          {results.proposals.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                Proposals ({results.proposals.length})
              </div>
              <div className="space-y-1.5">
                {results.proposals.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigateTo(`/proposals/builder?id=${p.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#1a1a20] hover:bg-[#23232b] cursor-pointer border border-transparent hover:border-zinc-700 transition group"
                  >
                    <div>
                      <div className="font-medium text-sm text-zinc-200 group-hover:text-amber-400">
                        Proposal for {p.client_name}
                      </div>
                      <div className="text-xs text-zinc-500">${p.total_investment}</div>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
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
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                <Receipt className="w-3.5 h-3.5 text-purple-400" />
                Invoices ({results.invoices.length})
              </div>
              <div className="space-y-1.5">
                {results.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => navigateTo(`/invoices/builder?id=${inv.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#1a1a20] hover:bg-[#23232b] cursor-pointer border border-transparent hover:border-zinc-700 transition group"
                  >
                    <div>
                      <div className="font-medium text-sm text-zinc-200 group-hover:text-purple-400">
                        {inv.invoice_number} — {inv.client_name}
                      </div>
                      <div className="text-xs text-zinc-500">${inv.amount}</div>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
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
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                Interactions ({results.interactions.length})
              </div>
              <div className="space-y-1.5">
                {results.interactions.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-2.5 rounded-lg bg-[#1a1a20] border border-zinc-800/80"
                  >
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                      <span className="font-semibold text-zinc-300">
                        {msg.channel} with {msg.target_name}
                      </span>
                      <span>{new Date(msg.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-zinc-400 line-clamp-2">{msg.content}</div>
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
