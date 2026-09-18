"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  ExternalLink,
  Loader2,
  Receipt,
  FileText,
  CheckCircle2,
  Clock,
  Search,
} from "lucide-react";
import { useBusinessBrain } from "@/context/BusinessBrainContext";

interface ClientItem {
  id: string;
  business_name: string;
  primary_contact?: string | null;
  email?: string | null;
  phone?: string | null;
  stage: string;
  payment_status: string;
  last_activity: string;
  created_at: string;
  proposals?: Array<{ id: string; status: string; total_investment: number }>;
  invoices?: Array<{ id: string; status: string; amount: number }>;
}

export default function ClientListPage() {
  const router = useRouter();
  const { setActiveEntity } = useBusinessBrain();

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const json = await res.json();
        setClients(json.clients || []);
      }
    } catch (err) {
      console.error("Failed to fetch clients", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    setActiveEntity({
      type: "client",
      name: "Client Conversion & Delivery",
      data: { view: "client_list" },
    });
  }, []);

  const filtered = clients.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.business_name.toLowerCase().includes(q) ||
      (c.primary_contact && c.primary_contact.toLowerCase().includes(q)) ||
      c.stage.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#202026]">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <span>S5 — Client List (Workspace B)</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Client Conversion &amp; Delivery Engine. Tracking won deals from proposal through delivery and active status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/proposals/builder"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>New Proposal</span>
          </Link>
          <Link
            href="/invoices/builder"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1c1c24] hover:bg-[#262632] text-zinc-200 text-xs font-medium border border-zinc-700 transition"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>New Invoice</span>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3.5 rounded-xl bg-[#141417] border border-[#26262e] flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter clients by name, contact, stage..."
            className="w-full bg-[#1b1b22] border border-[#2d2d38] rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-amber-500 transition"
          />
        </div>
        <span className="text-xs text-zinc-400">{filtered.length} total client(s)</span>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-[#141417] border border-[#26262e] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 space-y-2">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
            <p className="text-xs">Loading client portfolio...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 space-y-3">
            <Briefcase className="w-10 h-10 mx-auto text-zinc-600" />
            <p className="text-sm">No clients in conversion pipeline yet.</p>
            <p className="text-xs text-zinc-500">
              When a lead in Workspace A reaches agreement, click &quot;Move to Proposal&quot; on their Lead Card.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#18181f] text-zinc-400 border-b border-[#26262e]">
                <tr>
                  <th className="p-3.5">Business Name</th>
                  <th className="p-3.5">Primary Contact</th>
                  <th className="p-3.5">Conversion Stage</th>
                  <th className="p-3.5">Payment Status</th>
                  <th className="p-3.5">Last Activity</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filtered.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => router.push(`/clients/${client.id}`)}
                    className="hover:bg-[#1a1a21] cursor-pointer transition group"
                  >
                    <td className="p-3.5 font-medium text-zinc-100 group-hover:text-amber-400 transition">
                      <div>{client.business_name}</div>
                      {client.email && <div className="text-[11px] text-zinc-500">{client.email}</div>}
                    </td>
                    <td className="p-3.5 text-zinc-300">
                      {client.primary_contact || <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          client.stage === "Active"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : client.stage === "Onboarding"
                            ? "bg-blue-950 text-blue-300 border border-blue-800"
                            : client.stage === "Paid"
                            ? "bg-teal-950 text-teal-300 border border-teal-800"
                            : client.stage === "Invoice"
                            ? "bg-purple-950 text-purple-300 border border-purple-800"
                            : "bg-amber-950 text-amber-300 border border-amber-800"
                        }`}
                      >
                        {client.stage}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                          client.payment_status === "Paid"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                            : client.payment_status === "Overdue"
                            ? "bg-red-950 text-red-400 border border-red-800/60"
                            : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                        }`}
                      >
                        {client.payment_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-zinc-400">
                      {new Date(client.last_activity).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/clients/${client.id}`}
                        className="px-2.5 py-1 rounded bg-[#1e1e26] hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 border border-zinc-700/60 transition inline-flex items-center gap-1"
                      >
                        <span>Timeline</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
