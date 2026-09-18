"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Sparkles,
  Database,
  BookMarked,
  ChevronRight,
  Info,
} from "lucide-react";
import { useBusinessBrain } from "@/context/BusinessBrainContext";

// ─── Types ────────────────────────────────────────────────────────────────────

/** The system fields a CSV column can map to */
type SystemField =
  | "business_name"
  | "website"
  | "phone"
  | "email"
  | "city"
  | "niche"
  | "notes"
  | "ignore";

const SYSTEM_FIELDS: { value: SystemField; label: string }[] = [
  { value: "business_name", label: "Business Name (Required)" },
  { value: "website", label: "Website / Social" },
  { value: "phone", label: "Phone / WhatsApp" },
  { value: "email", label: "Email Address" },
  { value: "city", label: "City / Location" },
  { value: "niche", label: "Niche / Industry" },
  { value: "notes", label: "Notes / Context" },
  { value: "ignore", label: "Don'\''t map — store as extra data only" },
];

type Confidence = "high" | "suggestion" | "none";

interface ColumnGuess {
  csvHeader: string;
  systemField: SystemField;
  confidence: Confidence;
}

// ─── Fuzzy guesser ────────────────────────────────────────────────────────────

function guessSystemField(header: string): { field: SystemField; confidence: Confidence } {
  const h = header.toLowerCase().trim();

  // Business Name
  if (
    h === "business name" || h === "business_name" || h === "company" ||
    h === "company name" || h === "name" || h === "shop name" ||
    h.includes("shop") || h.includes("business") || h.includes("company")
  ) {
    const confidence: Confidence = (h === "business_name" || h === "business name" || h === "company name") ? "high" : "suggestion";
    return { field: "business_name", confidence };
  }

  // Website
  if (
    h === "website" || h === "url" || h === "web" || h === "website/social" ||
    h === "social" || h === "social media" || h === "instagram" ||
    h.includes("website") || h.includes("url") || h.includes("social")
  ) {
    const confidence: Confidence = (h === "website" || h === "url") ? "high" : "suggestion";
    return { field: "website", confidence };
  }

  // Phone
  if (
    h === "phone" || h === "mobile" || h === "tel" || h === "telephone" ||
    h === "phone number" || h === "whatsapp" ||
    h.includes("phone") || h.includes("mobile") || h.includes("tel")
  ) {
    const confidence: Confidence = (h === "phone" || h === "mobile" || h === "telephone") ? "high" : "suggestion";
    return { field: "phone", confidence };
  }

  // Email
  if (h === "email" || h === "email address" || h.includes("email") || h.includes("mail")) {
    const confidence: Confidence = h === "email" ? "high" : "suggestion";
    return { field: "email", confidence };
  }

  // City / Location
  if (
    h === "city" || h === "location" || h === "country" || h === "address" ||
    h === "service area" || h === "area" || h === "region" ||
    h.includes("city") || h.includes("location") || h.includes("country") ||
    h.includes("service area") || h.includes("area")
  ) {
    // "address" is ambiguous — give suggestion only
    const confidence: Confidence =
      (h === "city" || h === "location" || h === "country") ? "high" : "suggestion";
    return { field: "city", confidence };
  }

  // Niche / Industry
  if (
    h === "niche" || h === "industry" || h === "category" ||
    h === "specialization" || h === "specialisation" || h === "sector" ||
    h === "type" || h === "service type" ||
    h.includes("niche") || h.includes("industry") || h.includes("special") ||
    h.includes("category") || h.includes("sector")
  ) {
    const confidence: Confidence =
      (h === "niche" || h === "industry" || h === "category") ? "high" : "suggestion";
    return { field: "niche", confidence };
  }

  // Notes
  if (
    h === "notes" || h === "note" || h === "comments" || h === "description" ||
    h === "remarks" || h === "details" ||
    h.includes("note") || h.includes("comment") || h.includes("desc")
  ) {
    const confidence: Confidence = h === "notes" ? "high" : "suggestion";
    return { field: "notes", confidence };
  }

  // No match
  return { field: "ignore", confidence: "none" };
}

// ─── Header signature ─────────────────────────────────────────────────────────

function buildSignature(headers: string[]): string {
  return [...headers].sort().join("|");
}

// ─── Confidence badge ─────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  if (confidence === "high")
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800/60">
        🟢 High confidence
      </span>
    );
  if (confidence === "suggestion")
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-950 text-amber-300 border border-amber-800/60">
        🟡 Suggestion
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
      ⚪ Unmapped
    </span>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function CsvImportPage() {
  const router = useRouter();
  const { setActiveEntity } = useBusinessBrain();

  const [step, setStep] = useState<"upload" | "map" | "preview" | "importing" | "done">("upload");
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");

  // Column guesses: csvHeader → { systemField, confidence }
  const [columnGuesses, setColumnGuesses] = useState<ColumnGuess[]>([]);

  // Template memory
  const [templateName, setTemplateName] = useState("Saved Mapping");
  const [savedTemplateDetected, setSavedTemplateDetected] = useState(false);
  const [headerSignature, setHeaderSignature] = useState("");

  // Import settings
  const [generateAiSnapshots, setGenerateAiSnapshots] = useState(true);
  const [importResult, setImportResult] = useState<{
    imported_count: number;
    duplicate_count: number;
    duplicates: any[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // ─── File upload handler ─────────────────────────────────────────────────

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg("");
    setSavedTemplateDetected(false);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (!results.data || results.data.length === 0) {
          setErrorMsg("The uploaded CSV file is empty.");
          return;
        }

        const detectedHeaders: string[] = results.meta.fields || Object.keys(results.data[0] || {});
        setHeaders(detectedHeaders);
        setCsvData(results.data as any[]);

        const sig = buildSignature(detectedHeaders);
        setHeaderSignature(sig);

        // Try to load saved template from DB
        let savedMappings: Record<string, SystemField> | null = null;
        let savedName = "Saved Mapping";
        try {
          const res = await fetch(`/api/csv-mapping-templates?signature=${encodeURIComponent(sig)}`);
          if (res.ok) {
            const json = await res.json();
            if (json.template) {
              savedMappings = json.template.field_mappings as Record<string, SystemField>;
              savedName = json.template.template_name;
              setSavedTemplateDetected(true);
            }
          }
        } catch (_) {
          // If network fails, fall through to auto-guess
        }

        setTemplateName(savedName);

        // Build column guesses — use saved template if available, else fuzzy-guess
        const guesses: ColumnGuess[] = detectedHeaders.map((h) => {
          if (savedMappings && h in savedMappings) {
            return {
              csvHeader: h,
              systemField: savedMappings[h],
              confidence: "high" as Confidence, // Came from saved template
            };
          }
          const { field, confidence } = guessSystemField(h);
          return { csvHeader: h, systemField: field, confidence };
        });

        setColumnGuesses(guesses);
        setStep("map");
      },
      error: (err) => {
        setErrorMsg(`Failed to parse CSV: ${err.message}`);
      },
    });
  }, []);

  // ─── Update a single column''s mapping ────────────────────────────────────

  const updateMapping = (csvHeader: string, newField: SystemField) => {
    setColumnGuesses((prev) =>
      prev.map((g) =>
        g.csvHeader === csvHeader
          ? { ...g, systemField: newField, confidence: g.confidence === "none" && newField !== "ignore" ? "high" : g.confidence }
          : g
      )
    );
  };

  // ─── Derived helpers ─────────────────────────────────────────────────────

  /** The CSV header mapped to a given system field (first one wins) */
  const getMappedHeader = (field: SystemField): string | null => {
    const match = columnGuesses.find((g) => g.systemField === field);
    return match?.csvHeader ?? null;
  };

  const businessNameHeader = getMappedHeader("business_name");
  const canProceed = !!businessNameHeader;

  // ─── Execute import ───────────────────────────────────────────────────────

  const executeImport = async () => {
    setStep("importing");
    setErrorMsg("");

    // Build final mapping map
    const fieldMap: Record<string, SystemField> = {};
    columnGuesses.forEach((g) => {
      fieldMap[g.csvHeader] = g.systemField;
    });

    // Save template to DB
    try {
      await fetch("/api/csv-mapping-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          header_signature: headerSignature,
          template_name: templateName,
          field_mappings: fieldMap,
        }),
      });
    } catch (_) {
      // Non-fatal — proceed with import even if save fails
    }

    // Map rows
    const mappedRows = csvData.map((row) => {
      const nameHeader = getMappedHeader("business_name");
      const websiteHeader = getMappedHeader("website");
      const phoneHeader = getMappedHeader("phone");
      const emailHeader = getMappedHeader("email");
      const cityHeader = getMappedHeader("city");
      const nicheHeader = getMappedHeader("niche");
      const notesHeader = getMappedHeader("notes");

      return {
        business_name: (nameHeader && row[nameHeader]) || "Untitled Lead",
        website: websiteHeader ? row[websiteHeader] || null : null,
        phone: phoneHeader ? row[phoneHeader] || null : null,
        email: emailHeader ? row[emailHeader] || null : null,
        city: cityHeader ? row[cityHeader] || null : null,
        niche: nicheHeader ? row[nicheHeader] || null : null,
        notes: notesHeader ? row[notesHeader] || null : null,
        source_csv_row: row, // Full raw row — no data lost
      };
    });

    try {
      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: mappedRows,
          generate_ai_snapshots: generateAiSnapshots,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error((errJson as any).error || "Import failed");
      }

      const result = await res.json();
      setImportResult(result);
      setStep("done");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process import");
      setStep("preview");
    }
  };

  // ─── Preview rows ─────────────────────────────────────────────────────────

  const previewRows = csvData.slice(0, 10).map((row) => ({
    business_name: getMappedHeader("business_name") ? row[getMappedHeader("business_name")!] : "—",
    niche: getMappedHeader("niche") ? row[getMappedHeader("niche")!] : "—",
    city: getMappedHeader("city") ? row[getMappedHeader("city")!] : "—",
    phone: getMappedHeader("phone") ? row[getMappedHeader("phone")!] : "—",
    website: getMappedHeader("website") ? row[getMappedHeader("website")!] : "—",
    extraKeys: columnGuesses
      .filter((g) => g.systemField === "ignore")
      .map((g) => g.csvHeader),
  }));

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Screen Header */}
      <div className="pb-4 border-b border-[#202026]">
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
          <span>S2 — CSV Import (Lead Engine)</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Bring raw lead data in safely. Raw rows remain immutable as the factual source of truth.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Step 1: Upload ── */}
      {step === "upload" && (
        <div className="p-8 rounded-xl bg-[#141417] border border-[#26262e] text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-200">Select or drop your CSV file</h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
              Supports lead lists from Google Maps, Apollo, LinkedIn, or manual spreadsheets.
              Any column format is accepted — you will map columns manually before import.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold cursor-pointer transition">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Choose CSV File</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      )}

      {/* ── Step 2: Column Mapping ── */}
      {step === "map" && (
        <div className="p-6 rounded-xl bg-[#141417] border border-[#26262e] space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-zinc-200">
                Map Columns — {fileName}
              </h2>
              <p className="text-xs text-zinc-400">
                For each column in your CSV, choose what system field it maps to.
                Columns set to &quot;Don&apos;t map&quot; are still saved in full — nothing is lost.
              </p>
            </div>
            <span className="flex-shrink-0 text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-300">
              {csvData.length} records
            </span>
          </div>

          {/* Saved template banner */}
          {savedTemplateDetected && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-300">
              <BookMarked className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Remembered mapping from a previous import</strong> — review each row and confirm before proceeding.
              </span>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-[11px] text-zinc-400 pb-1">
            <span className="flex items-center gap-1"><span>🟢</span> High confidence — near-exact match</span>
            <span className="flex items-center gap-1"><span>🟡</span> Suggestion — fuzzy match, please verify</span>
            <span className="flex items-center gap-1"><span>⚪</span> Unmapped — no guess, data stored as extra</span>
          </div>

          {/* Per-column mapping rows */}
          <div className="space-y-3">
            {columnGuesses.map((guess) => {
              const previewVal = csvData[0]?.[guess.csvHeader];
              return (
                <div
                  key={guess.csvHeader}
                  className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-3 p-3 rounded-lg bg-[#191922] border border-zinc-800/60"
                >
                  {/* Left: CSV column info */}
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-zinc-200 truncate">{guess.csvHeader}</div>
                    {previewVal !== undefined && previewVal !== "" && (
                      <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                        e.g. &ldquo;{String(previewVal).slice(0, 60)}&rdquo;
                      </div>
                    )}
                    <div className="mt-1">
                      <ConfidenceBadge confidence={guess.confidence} />
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-4 h-4 text-zinc-600 hidden md:block flex-shrink-0" />

                  {/* Right: System field dropdown */}
                  <select
                    value={guess.systemField}
                    onChange={(e) => updateMapping(guess.csvHeader, e.target.value as SystemField)}
                    className="w-full bg-[#1b1b22] border border-[#2c2c36] rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:border-amber-500 transition"
                  >
                    {SYSTEM_FIELDS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          {/* Validation notice if Business Name unmapped */}
          {!canProceed && (
            <div className="flex items-center gap-2 text-xs text-red-400 p-3 rounded-lg bg-red-950/30 border border-red-800/40">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>You must map at least one column to <strong>Business Name</strong> before proceeding.</span>
            </div>
          )}

          {/* Template name */}
          <div className="space-y-1 pt-2 border-t border-zinc-800">
            <label className="text-xs font-medium text-zinc-400">
              Template name (saved to database for future imports)
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Google Maps Export, Apollo Beauty Leads..."
              className="w-full bg-[#1b1b22] border border-[#2c2c36] rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Nav buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep("upload")}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Back
            </button>
            <button
              onClick={() => setStep("preview")}
              disabled={!canProceed}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold disabled:opacity-50 transition"
            >
              <span>Next: Preview Data</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Preview ── */}
      {step === "preview" && (
        <div className="p-6 rounded-xl bg-[#141417] border border-[#26262e] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-200">Preview First 10 Rows</h2>
              <p className="text-xs text-zinc-400">Confirm your column alignment before creating records.</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-300">
              Total to import: {csvData.length}
            </span>
          </div>

          <div className="overflow-x-auto border border-[#26262e] rounded-lg">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-[#1b1b22] text-zinc-400 border-b border-[#26262e]">
                <tr>
                  <th className="p-2.5">Business Name</th>
                  <th className="p-2.5">Niche / Industry</th>
                  <th className="p-2.5">City / Location</th>
                  <th className="p-2.5">Phone</th>
                  <th className="p-2.5">Website / Social</th>
                  <th className="p-2.5 text-zinc-600">Extra Data (stored)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {previewRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/30">
                    <td className="p-2.5 font-medium text-zinc-200">{row.business_name || "Untitled"}</td>
                    <td className="p-2.5 text-zinc-400">{row.niche || "—"}</td>
                    <td className="p-2.5 text-zinc-400">{row.city || "—"}</td>
                    <td className="p-2.5 text-zinc-400">{row.phone || "—"}</td>
                    <td className="p-2.5 text-zinc-400 max-w-[150px] truncate">{row.website || "—"}</td>
                    <td className="p-2.5 text-zinc-600 text-[11px]">
                      {row.extraKeys.length > 0
                        ? row.extraKeys.join(", ")
                        : <span className="text-zinc-700">none</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI snapshot toggle */}
          <div className="p-4 rounded-lg bg-[#191922] border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs font-semibold text-zinc-200">
                  Generate AI Business Snapshot for imported leads
                </div>
                <div className="text-[11px] text-zinc-400">
                  Strictly extracts facts and inferences with zero hallucination.
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={generateAiSnapshots}
              onChange={(e) => setGenerateAiSnapshots(e.target.checked)}
              className="w-4 h-4 accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <button
              onClick={() => setStep("map")}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Change Mapping
            </button>
            <button
              onClick={executeImport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Confirm Import ({csvData.length} Leads)</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Importing ── */}
      {step === "importing" && (
        <div className="p-12 rounded-xl bg-[#141417] border border-[#26262e] text-center space-y-4">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
          <h2 className="text-base font-semibold text-zinc-200">Importing leads and running duplicate check...</h2>
          <p className="text-xs text-zinc-400">
            Writing verified records to PostgreSQL and saving mapping template for future imports.
          </p>
        </div>
      )}

      {/* ── Step 5: Done ── */}
      {step === "done" && importResult && (
        <div className="p-8 rounded-xl bg-[#141417] border border-emerald-900/50 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-zinc-100">Import Completed Successfully!</h2>
            <p className="text-sm text-zinc-400 mt-1">
              {importResult.imported_count} new leads were added with status <strong>Imported</strong>.
              {importResult.duplicate_count > 0 && (
                <span className="text-amber-400 block mt-1">
                  ({importResult.duplicate_count} duplicates were skipped based on matching website/phone/email).
                </span>
              )}
            </p>
            <p className="text-xs text-emerald-400 mt-2">
              ✓ Column mapping saved to database — next import with the same CSV format will pre-fill automatically.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => {
                setStep("upload");
                setCsvData([]);
                setHeaders([]);
                setColumnGuesses([]);
                setSavedTemplateDetected(false);
              }}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium"
            >
              Import Another File
            </button>
            <button
              onClick={() => router.push("/leads")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold"
            >
              <span>Go to Lead Engine</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
