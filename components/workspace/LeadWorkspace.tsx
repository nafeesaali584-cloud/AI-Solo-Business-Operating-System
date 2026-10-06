"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Link as LinkIcon,
  Video,
  Paperclip,
  Plus,
  Pin,
  Trash2,
  Edit2,
  ExternalLink,
  Search,
  Download,
  Loader2,
  X,
  Play,
  Globe,
  Check,
  AlertCircle,
  FileSpreadsheet,
  FileCheck,
} from "lucide-react";
import { detectProvider, extractYouTubeId, getYouTubeEmbedUrl } from "@/lib/workspace/provider";

export type WorkspaceItemType = "NOTE" | "FILE" | "LINK" | "VIDEO";

export interface WorkspaceItem {
  id: string;
  leadId: string;
  type: WorkspaceItemType;
  title: string | null;
  content: string | null;
  url: string | null;
  provider: string | null;
  fileKey: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  isPinned: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceCounts {
  total: number;
  notes: number;
  files: number;
  links: number;
  videos: number;
}

interface LeadWorkspaceProps {
  leadId: string;
}

export default function LeadWorkspace({ leadId }: LeadWorkspaceProps) {
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [counts, setCounts] = useState<WorkspaceCounts>({
    total: 0,
    notes: 0,
    files: 0,
    links: 0,
    videos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"ALL" | WorkspaceItemType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<WorkspaceItemType>("NOTE");
  const [editingItem, setEditingItem] = useState<WorkspaceItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch workspace items
  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/leads/${leadId}/workspace`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setCounts(data.counts || { total: 0, notes: 0, files: 0, links: 0, videos: 0 });
      }
    } catch (err) {
      console.error("Failed to load workspace items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) fetchWorkspace();
  }, [leadId]);

  // Open modal for quick add
  const handleOpenAdd = (type: WorkspaceItemType) => {
    setEditingItem(null);
    setModalType(type);
    setFormTitle("");
    setFormContent("");
    setFormUrl("");
    setFormFile(null);
    setFormIsPinned(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (item: WorkspaceItem) => {
    setEditingItem(item);
    setModalType(item.type);
    setFormTitle(item.title || "");
    setFormContent(item.content || "");
    setFormUrl(item.url || "");
    setFormFile(null);
    setFormIsPinned(item.isPinned);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Toggle Pin status
  const handleTogglePin = async (item: WorkspaceItem) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/workspace/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !item.isPinned }),
      });
      if (res.ok) {
        fetchWorkspace();
      }
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  // Delete item
  const handleDelete = async (item: WorkspaceItem) => {
    if (!confirm(`Are you sure you want to delete this ${item.type.toLowerCase()}?`)) return;
    try {
      const res = await fetch(`/api/leads/${leadId}/workspace/${item.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchWorkspace();
      }
    } catch (err) {
      console.error("Failed to delete workspace item:", err);
    }
  };

  // Submit Add or Edit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    try {
      if (editingItem) {
        // Edit existing item
        const payload: any = {
          title: formTitle,
          content: formContent,
          isPinned: formIsPinned,
        };
        if (editingItem.type === "LINK" || editingItem.type === "VIDEO") {
          payload.url = formUrl;
        }

        const res = await fetch(`/api/leads/${leadId}/workspace/${editingItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errJson = await res.json();
          throw new Error(errJson.error || "Failed to update item");
        }
      } else {
        // Create new item
        if (modalType === "FILE") {
          if (!formFile) throw new Error("Please select a file to upload.");

          const formData = new FormData();
          formData.append("file", formFile);
          if (formTitle) formData.append("title", formTitle);
          if (formContent) formData.append("content", formContent);
          if (formIsPinned) formData.append("isPinned", "true");

          const res = await fetch(`/api/leads/${leadId}/workspace`, {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const errJson = await res.json();
            throw new Error(errJson.error || "Failed to upload file");
          }
        } else {
          // JSON payload for NOTE, LINK, VIDEO
          if (modalType === "VIDEO" && !extractYouTubeId(formUrl)) {
            throw new Error("Please provide a valid YouTube video or Shorts URL.");
          }
          if (modalType === "LINK" && !formUrl.trim()) {
            throw new Error("Please provide a valid URL.");
          }

          const res = await fetch(`/api/leads/${leadId}/workspace`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: modalType,
              title: formTitle,
              content: formContent,
              url: formUrl,
              isPinned: formIsPinned,
            }),
          });

          if (!res.ok) {
            const errJson = await res.json();
            throw new Error(errJson.error || "Failed to create item");
          }
        }
      }

      setIsModalOpen(false);
      await fetchWorkspace();
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filtered & searched items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesType = filterType === "ALL" || item.type === filterType;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.content && item.content.toLowerCase().includes(q)) ||
        (item.url && item.url.toLowerCase().includes(q));
      return matchesType && matchesSearch;
    });
  }, [items, filterType, searchQuery]);

  // Format file size
  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-6">
      {/* ─── WORKSPACE HEADER & SUMMARY ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold font-heading text-[var(--text-primary)]">
              Research Workspace
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)] font-medium">
              Permanent CRUD
            </span>
          </div>
          <p className="text-xs text-[var(--text-dim)] mt-0.5">
            {counts.total === 0 ? (
              "Persistent repository for notes, links, YouTube audits, and files."
            ) : (
              <span>
                <strong className="text-[var(--text-primary)]">{counts.total} items</strong> • {counts.notes} notes • {counts.links} links • {counts.videos} videos • {counts.files} files
              </span>
            )}
          </p>
        </div>

        {/* Quick Add Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenAdd("NOTE")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>+ Note</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenAdd("LINK")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-semibold transition-colors"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>+ Link</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenAdd("VIDEO")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-colors"
          >
            <Video className="w-3.5 h-3.5" />
            <span>+ Video</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenAdd("FILE")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-colors"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>+ File</span>
          </button>
        </div>
      </div>

      {/* ─── FILTERS & SEARCH BAR ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Type Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            type="button"
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              filterType === "ALL"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            All ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("NOTE")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              filterType === "NOTE"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Notes ({counts.notes})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("LINK")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              filterType === "LINK"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Links ({counts.links})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("VIDEO")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              filterType === "VIDEO"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Videos ({counts.videos})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("FILE")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              filterType === "FILE"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Files ({counts.files})
          </button>
        </div>

        {/* Search input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-[var(--text-dim)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-primary)]"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ─── ITEMS LIST / GRID ─── */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-xs text-[var(--text-dim)]">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
          <span>Loading workspace items...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-xl space-y-3">
          <p className="text-xs text-[var(--text-dim)]">
            {searchQuery
              ? `No workspace items matched "${searchQuery}".`
              : "No research items yet in this lead's workspace."}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenAdd("NOTE")}
              className="text-xs text-[var(--accent)] hover:underline font-semibold"
            >
              + Add a Note
            </button>
            <span className="text-[var(--text-dim)]">•</span>
            <button
              type="button"
              onClick={() => handleOpenAdd("LINK")}
              className="text-xs text-[var(--accent)] hover:underline font-semibold"
            >
              + Add a Link
            </button>
            <span className="text-[var(--text-dim)]">•</span>
            <button
              type="button"
              onClick={() => handleOpenAdd("VIDEO")}
              className="text-xs text-[var(--accent)] hover:underline font-semibold"
            >
              + Add a Video
            </button>
            <span className="text-[var(--text-dim)]">•</span>
            <button
              type="button"
              onClick={() => handleOpenAdd("FILE")}
              className="text-xs text-[var(--accent)] hover:underline font-semibold"
            >
              + Upload File
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-4.5 space-y-3 transition-all relative ${
                item.isPinned
                  ? "bg-[var(--surface-raised)] border-amber-500/40 shadow-sm"
                  : "bg-[var(--surface-hover)] border-[var(--border)]"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  {/* Type Badge */}
                  {item.type === "NOTE" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <FileText className="w-3 h-3" /> Note
                    </span>
                  )}
                  {item.type === "LINK" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                      <Globe className="w-3 h-3" /> {item.provider || "LINK"}
                    </span>
                  )}
                  {item.type === "VIDEO" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      <Play className="w-3 h-3" /> YOUTUBE
                    </span>
                  )}
                  {item.type === "FILE" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Paperclip className="w-3 h-3" /> FILE
                    </span>
                  )}

                  {/* Pinned pill */}
                  {item.isPinned && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      <Pin className="w-2.5 h-2.5 fill-amber-300" /> Pinned
                    </span>
                  )}

                  <span className="text-[10px] text-[var(--text-dim)]">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Actions: Pin, Edit, Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTogglePin(item)}
                    title={item.isPinned ? "Unpin item" : "Pin to top"}
                    className={`p-1.5 rounded-lg transition-colors ${
                      item.isPinned
                        ? "text-amber-400 hover:bg-amber-500/20"
                        : "text-[var(--text-dim)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
                    }`}
                  >
                    <Pin className={`w-3.5 h-3.5 ${item.isPinned ? "fill-amber-400" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    title="Edit item"
                    className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    title="Delete item"
                    className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title */}
              {item.title && (
                <h3 className="text-xs font-bold text-[var(--text-primary)] break-words">
                  {item.title}
                </h3>
              )}

              {/* Item Specific Content */}
              {/* 1. NOTE */}
              {item.type === "NOTE" && item.content && (
                <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed bg-[var(--surface)]/50 p-3 rounded-lg border border-[var(--border)]/60">
                  {item.content}
                </p>
              )}

              {/* 2. LINK */}
              {item.type === "LINK" && (
                <div className="space-y-2">
                  {item.url && (
                    <a
                      href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline break-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.url}</span>
                    </a>
                  )}
                  {item.content && (
                    <p className="text-xs text-[var(--text-muted)] italic">
                      {item.content}
                    </p>
                  )}
                </div>
              )}

              {/* 3. VIDEO */}
              {item.type === "VIDEO" && (
                <div className="space-y-2.5">
                  {item.url && getYouTubeEmbedUrl(item.url) ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-[var(--border)] bg-black">
                      <iframe
                        src={getYouTubeEmbedUrl(item.url)!}
                        title={item.title || "YouTube video"}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:underline"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Watch YouTube Video</span>
                    </a>
                  ) : null}

                  {item.content && (
                    <p className="text-xs text-[var(--text-secondary)] bg-[var(--surface)]/50 p-2.5 rounded-lg border border-[var(--border)]/60">
                      <strong>Takeaway:</strong> {item.content}
                    </p>
                  )}
                </div>
              )}

              {/* 4. FILE */}
              {item.type === "FILE" && (
                <div className="space-y-2 bg-[var(--surface)]/60 p-3 rounded-lg border border-[var(--border)]">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-semibold text-[var(--text-primary)] truncate block">
                          {item.title || "Attached File"}
                        </span>
                        <span className="text-[10px] text-[var(--text-dim)]">
                          {formatFileSize(item.fileSizeBytes)} {item.provider === "R2" ? "• Cloudflare R2" : "• Local"}
                        </span>
                      </div>
                    </div>

                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-xs text-[var(--accent)] font-semibold transition-colors shrink-0"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </a>
                    )}
                  </div>

                  {item.content && (
                    <p className="text-xs text-[var(--text-muted)] italic pt-1 border-t border-[var(--border)]/50">
                      {item.content}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── ADD / EDIT MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">
                  {editingItem ? `Edit ${modalType}` : `Add to Workspace: ${modalType}`}
                </h3>
                <p className="text-xs text-[var(--text-dim)]">
                  Items persist permanently across all stages and quotas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If adding new item: Type Selector Tabs */}
            {!editingItem && (
              <div className="grid grid-cols-4 gap-2 text-xs">
                {(["NOTE", "LINK", "VIDEO", "FILE"] as WorkspaceItemType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setModalType(t);
                      setFormError(null);
                    }}
                    className={`py-2 rounded-lg font-semibold border transition-colors flex flex-col items-center gap-1 ${
                      modalType === t
                        ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                        : "bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {t === "NOTE" && <FileText className="w-4 h-4" />}
                    {t === "LINK" && <LinkIcon className="w-4 h-4" />}
                    {t === "VIDEO" && <Video className="w-4 h-4" />}
                    {t === "FILE" && <Paperclip className="w-4 h-4" />}
                    <span className="capitalize">{t.toLowerCase()}</span>
                  </button>
                ))}
              </div>
            )}

            {formError && (
              <div className="p-3 rounded-lg bg-[var(--danger-soft)] border border-[var(--danger)]/30 text-xs text-[var(--danger)] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  {modalType === "NOTE" ? "Note Title / Topic" : "Title / Label (optional)"}
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={
                    modalType === "NOTE"
                      ? "e.g., Conversion bottleneck observation"
                      : modalType === "LINK"
                      ? "e.g., Competitor Pricing Page"
                      : modalType === "VIDEO"
                      ? "e.g., Loom/YouTube audit walkthrough"
                      : "e.g., Client PDF pitch deck"
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* URL input for LINK & VIDEO */}
              {(modalType === "LINK" || modalType === "VIDEO") && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">
                      {modalType === "VIDEO" ? "YouTube URL (Standard or Shorts):" : "URL:"}
                    </label>
                    {formUrl && modalType === "LINK" && (
                      <span className="text-[10px] text-sky-400 font-semibold">
                        Provider: {detectProvider(formUrl)}
                      </span>
                    )}
                  </div>
                  <input
                    type="url"
                    required
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder={
                      modalType === "VIDEO"
                        ? "https://www.youtube.com/watch?v=... or shorts/..."
                        : "https://example.com/pricing or instagram.com/..."
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              )}

              {/* File input for FILE */}
              {modalType === "FILE" && !editingItem && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    File (PDF, PNG, JPG, CSV, XLSX, etc.):
                  </label>
                  <input
                    type="file"
                    required
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setFormFile(f);
                      if (f && !formTitle) setFormTitle(f.name);
                    }}
                    className="w-full text-xs text-[var(--text-muted)] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[var(--accent)] file:text-white hover:file:bg-[var(--accent-hover)] cursor-pointer"
                  />
                  <p className="text-[10px] text-[var(--text-dim)]">
                    Saved directly to Cloudflare R2 (or local fallback).
                  </p>
                </div>
              )}

              {/* Content / Notes / Takeaway */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  {modalType === "NOTE"
                    ? "Note Content (Observations, Pain Points, Offer Angles):"
                    : "Notes / Key Takeaways (optional):"}
                </label>
                <textarea
                  rows={modalType === "NOTE" ? 5 : 3}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={
                    modalType === "NOTE"
                      ? "Write rich research takeaways, offer brainstorm, competitor pricing details..."
                      : "Add specific call context or key observation from this resource..."
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Pinned Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheckbox"
                  checked={formIsPinned}
                  onChange={(e) => setFormIsPinned(e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] w-3.5 h-3.5"
                />
                <label htmlFor="pinCheckbox" className="text-xs text-[var(--text-secondary)] cursor-pointer">
                  Pin to top of workspace (for quick reference during client calls)
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingItem ? "Update Item" : "Add Item"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
