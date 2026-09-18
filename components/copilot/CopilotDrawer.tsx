"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Copy,
  Check,
  BrainCircuit,
  Bot,
  User,
  ShieldAlert,
  Globe,
  ExternalLink,
  BookmarkPlus,
} from "lucide-react";
import { FactBadge } from "@/components/ui/FactBadge";
import { useBusinessBrain } from "@/context/BusinessBrainContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isWebData?: boolean;
  sources?: Array<{ title: string; url: string }>;
  savedToRecord?: boolean;
}

export const CopilotDrawer: React.FC = () => {
  const {
    isCopilotOpen,
    setIsCopilotOpen,
    activeEntity,
    prefilledPrompt,
    setPrefilledPrompt,
  } = useBusinessBrain();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am your ClientPulse Copilot powered by Google Gemini. I automatically load context from whichever screen you are on (Business Brain). You can ask me what to do next, or ask me to search this business online for live details, website info, and market presence!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefilledPrompt) {
      setInput(prefilledPrompt);
      setPrefilledPrompt("");
    }
  }, [prefilledPrompt, setPrefilledPrompt]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    if (!textToSend || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!overrideText) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_query: textToSend,
          business_brain: {
            active_screen_type: activeEntity.type,
            active_entity_name: activeEntity.name,
            active_entity_id: activeEntity.id,
            details: activeEntity.data,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Copilot response failed.");
      }

      const data = await res.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        isWebData: !!data.is_web_search,
        sources: data.sources || [],
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `⚠️ Error: ${err.message || "Failed to contact Gemini API."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Manual User Action: Save research as note to active record
  const handleSaveToRecord = async (msg: Message) => {
    if (!activeEntity.id) {
      alert("No active lead or client record selected to save to.");
      return;
    }

    setSavingNoteId(msg.id);
    try {
      const payload: any = {
        content: `[Online Research Summary]\n${msg.content}`,
        channel: "Note",
      };
      if (activeEntity.type === "lead") payload.lead_id = activeEntity.id;
      if (activeEntity.type === "client") payload.client_id = activeEntity.id;

      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, savedToRecord: true } : m))
        );
      }
    } catch (err) {
      console.error("Failed to save note", err);
    } finally {
      setSavingNoteId(null);
    }
  };

  if (!isCopilotOpen) return null;

  const quickPrompts = [
    "Search this business online",
    "What should I do next?",
    "Why has this lead not moved?",
    "Prepare follow-up draft for this lead",
  ];

  return (
    <aside
      className="fixed inset-y-0 right-0 z-40 w-full sm:w-[440px] bg-[#121215] border-l border-[#26262c] shadow-2xl flex flex-col transition-all duration-300"
      aria-label="AI Copilot Drawer"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#232329] bg-[#16161b]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
              ClientPulse Copilot
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/40">
                Advisory
              </span>
            </h2>
            <div className="text-[11px] text-zinc-400 flex items-center gap-1">
              <BrainCircuit className="w-3 h-3 text-amber-400" />
              <span>Loaded: </span>
              <span className="text-zinc-200 font-medium truncate max-w-[200px]">
                {activeEntity.name || activeEntity.type}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsCopilotOpen(false)}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Safety Notice */}
      <div className="px-3 py-1.5 bg-[#181510] border-b border-amber-950 text-[11px] text-amber-400/90 flex items-center gap-1.5">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        <span>
          <strong>Hard Guardrail Active:</strong> Copilot advises &amp; drafts only. It cannot send messages or change payment statuses.
        </span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-[11px] text-zinc-500">
              {msg.role === "user" ? (
                <>
                  <span>You</span>
                  <User className="w-3 h-3" />
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Bot className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-300">Gemini Copilot</span>
                  {msg.isWebData && <FactBadge type="web" label="Live Web Data" />}
                </div>
              )}
            </div>
            <div
              className={`relative group max-w-[92%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-amber-600 text-white font-medium"
                  : "bg-[#1a1a20] text-zinc-200 border border-[#2c2c36]"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Source Citations for Web Grounding */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-zinc-800/80 space-y-1">
                  <div className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    <span>Verified Web Sources:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-cyan-950/60 text-cyan-300 hover:text-cyan-200 border border-cyan-800/50 hover:border-cyan-600 transition"
                      >
                        <span className="truncate max-w-[140px]">{s.title}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Toolbar for Assistant Response */}
              {msg.role === "assistant" && (
                <div className="mt-2.5 pt-2 border-t border-zinc-800/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {/* Manual Save to Record Action */}
                    {activeEntity.id && (activeEntity.type === "lead" || activeEntity.type === "client") && (
                      <button
                        onClick={() => handleSaveToRecord(msg)}
                        disabled={msg.savedToRecord || savingNoteId === msg.id}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition ${
                          msg.savedToRecord
                            ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                            : "bg-[#23232c] hover:bg-[#2c2c36] text-zinc-300 hover:text-amber-300 border-zinc-700"
                        }`}
                      >
                        {msg.savedToRecord ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Saved to Notes</span>
                          </>
                        ) : savingNoteId === msg.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="w-3 h-3" />
                            <span>Save to Record Notes</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => copyToClipboard(msg.content, msg.id)}
                    title="Copy response"
                    className="p-1 bg-zinc-800/80 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-200 transition"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-amber-400/80 italic p-2.5 bg-[#18181f] rounded-lg border border-zinc-800 w-fit">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            Analyzing with Google Gemini (checking online sources)...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-3 py-2 border-t border-[#232328] bg-[#141418] flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[#1e1e24] hover:bg-[#282832] text-zinc-300 hover:text-amber-300 text-[11px] border border-zinc-700/60 transition disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-[#232328] bg-[#16161b] flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Copilot or say 'search this business online'..."
          disabled={loading}
          className="flex-1 bg-[#1a1a20] border border-[#2f2f38] focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  );
};
