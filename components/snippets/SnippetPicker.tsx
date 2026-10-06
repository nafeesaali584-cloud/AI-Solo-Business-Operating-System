"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  ChevronDown,
  Search,
  Plus,
  Check,
  X,
  Loader2,
  Trash2,
  Edit2,
  Tag,
  Sparkles,
} from "lucide-react";
import { mergeSnippet, LeadMergeContext } from "@/lib/snippets/engine";

export interface Snippet {
  id: string;
  title: string;
  category: string;
  body: string;
}

interface SnippetPickerProps {
  leadContext: LeadMergeContext;
  onSelect: (mergedText: string) => void;
  buttonLabel?: string;
  className?: string;
}

export default function SnippetPicker({
  leadContext,
  onSelect,
  buttonLabel = "Insert Snippet",
  className = "",
}: SnippetPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // New Snippet Modal / inline form
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("WhatsApp");
  const [newBody, setNewBody] = useState("");
  const [savingSnippet, setSavingSnippet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch snippets
  const fetchSnippets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/snippets");
      if (res.ok) {
        const data = await res.json();
        setSnippets(data.snippets || []);
        setCategories(["All", ...(data.categories || [])]);
      }
    } catch (e) {
      console.error("Failed to load snippets", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSnippets();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Filter snippets
  const filtered = snippets.filter((s) => {
    const matchCat = activeCategory === "All" || s.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch =
      !q || s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const handleSelectSnippet = (snippet: Snippet) => {
    const merged = mergeSnippet(snippet.body, leadContext);
    onSelect(merged);
    setIsOpen(false);
  };

  const handleSaveNewSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) {
      setError("Title and Body are required.");
      return;
    }
    setSavingSnippet(true);
    setError(null);
    try {
      const res = await fetch("/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          body: newBody,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to save snippet");
      }
      setIsCreating(false);
      setNewTitle("");
      setNewBody("");
      await fetchSnippets();
    } catch (err: any) {
      setError(err.message || "Failed to create snippet");
    } finally {
      setSavingSnippet(false);
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors shadow-sm"
      >
        <BookOpen className="w-3.5 h-3.5" />
        <span>{buttonLabel}</span>
        <ChevronDown className={`w-3 h-3 text-[var(--text-dim)] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-w-[90vw] z-50 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-3.5 space-y-3 animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold font-heading text-[var(--text-primary)]">
                Reusable Snippet Library
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                Merge Engine
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsCreating(!isCreating)}
              className="text-[11px] font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
            >
              {isCreating ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              <span>{isCreating ? "Cancel" : "+ New"}</span>
            </button>
          </div>

          {/* New Snippet Inline Form */}
          {isCreating ? (
            <form onSubmit={handleSaveNewSnippet} className="space-y-2.5 bg-[var(--surface-hover)] p-3 rounded-lg border border-[var(--border)]">
              {error && <p className="text-[10px] text-[var(--danger)]">{error}</p>}
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Snippet Title (e.g. Cold WhatsApp Hook)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-2.5 py-1 rounded bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  required
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Category (WhatsApp, Follow-up, Email)"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-2.5 py-1 rounded bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="space-y-1">
                <textarea
                  rows={4}
                  placeholder="Message body with {{business_name}}, {{contact_name}}, {{offer}}, {{observation}}, {{city}}..."
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="w-full px-2.5 py-1 rounded bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  required
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-[var(--text-dim)]">
                <span>Tags: &#123;&#123;business_name&#125;&#125;, &#123;&#123;contact_name&#125;&#125;, &#123;&#123;offer&#125;&#125;</span>
                <button
                  type="submit"
                  disabled={savingSnippet}
                  className="px-3 py-1 rounded bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                >
                  {savingSnippet ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Search & Category Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3 h-3 text-[var(--text-dim)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search snippets..."
                    className="w-full pl-7 pr-2.5 py-1 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px]">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setActiveCategory(c)}
                      className={`px-2 py-0.5 rounded-md font-medium transition-colors shrink-0 ${
                        activeCategory === c
                          ? "bg-[var(--accent)] text-white"
                          : "bg-[var(--surface-hover)] text-[var(--text-dim)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Snippet List */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {loading ? (
                  <div className="flex items-center justify-center py-6 text-xs text-[var(--text-dim)]">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)] mr-2" />
                    <span>Loading snippets...</span>
                  </div>
                ) : filtered.length === 0 ? (
                  <p className="text-center py-6 text-xs text-[var(--text-dim)]">
                    No snippets found. Click "+ New" to add one!
                  </p>
                ) : (
                  filtered.map((snippet) => {
                    const previewMerged = mergeSnippet(snippet.body, leadContext);
                    return (
                      <div
                        key={snippet.id}
                        onClick={() => handleSelectSnippet(snippet)}
                        className="group p-2.5 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] border border-[var(--border)] hover:border-[var(--accent)] cursor-pointer transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] truncate">
                            {snippet.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--surface)] text-[var(--text-dim)] border border-[var(--border)]">
                            {snippet.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                          {previewMerged}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Merge Tag Cheat Sheet */}
              <div className="pt-2 border-t border-[var(--border)] text-[10px] text-[var(--text-dim)] flex items-center justify-between">
                <span>Clicking any snippet auto-merges lead values into your draft.</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
