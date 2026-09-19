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
  | "niche"
  | "key_services"
  | "rating"
  | "review_count"
  | "city"
  | "address"
  | "phone"
  | "website"
  | "email"
  | "notes"
  | "ignore";

const SYSTEM_FIELDS: { value: SystemField; label: string }[] = [
  { value: "business_name", label: "Business Name (Required)" },
  { value: "niche", label: "Niche / Industry" },
  { value: "key_services", label: "Key Services / Specialization" },
  { value: "rating", label: "Rating (e.g. 5.0 / 4.8)" },
  { value: "review_count", label: "Review Count (e.g. 15, 83)" },
  { value: "city", label: "City / Location" },
  { value: "address", label: "Street Address / Full Location" },
  { value: "phone", label: "Phone / WhatsApp" },
  { value: "website", label: "Website / Social" },
  { value: "email", label: "Email Address" },
  { value: "notes", label: "Notes / Context" },
  { value: "ignore", label: "Don't map — store as extra data only" },
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
    const confidence: Confidence = (h === "business_name" || h === "business name" || h === "company name" || h === "shop name") ? "high" : "suggestion";
    return { field: "business_name", confidence };
  }

  // Rating
  if (
    h === "rating" || h === "stars" || h === "score" || h === "review rating" ||
    h.includes("rating") || h.includes("stars")
  ) {
    return { field: "rating", confidence: "high" };
  }

  // Review Count
  if (
    h === "review count" || h === "reviews" || h === "review_count" ||
    h === "total reviews" || h === "number of reviews" || h.includes("review")
  ) {
    return { field: "review_count", confidence: "high" };
  }

  // Key Services / Specialization
  if (
    h === "key services" || h === "key_services" || h === "services" ||
    h === "specialization" || h === "specialisation" || h === "offerings" ||
    h.includes("key service") || h.includes("special")
  ) {
    return { field: "key_services", confidence: "high" };
  }

  // Street Address
  if (
    h === "address" || h === "street" || h === "street address" ||
    h === "full address" || h.includes("street") || h === "addr"
  ) {
    return { field: "address", confidence: "high" };
  }

  // City / Location
  if (
    h === "city" || h === "location" || h === "country" ||
    h === "service area" || h === "area" || h === "region" ||
    h.includes("city") || h.includes("location") || h.includes("country") ||
    h.includes("service area") || h.includes("area")
  ) {
    const confidence: Confidence =
      (h === "city" || h === "location" || h === "service area") ? "high" : "suggestion";
    return { field: "city", confidence };
  }

  // Niche / Industry
  if (
    h === "niche" || h === "industry" || h === "category" ||
    h === "sector" || h === "type" || h === "service type" ||
    h.includes("niche") || h.includes("industry") ||
    h.includes("category") || h.includes("sector")
  ) {
    const confidence: Confidence =
      (h === "niche" || h === "industry" || h === "category") ? "high" : "suggestion";
    return { field: "niche", confidence };
  }

  // Website
  if (
    h === "website" || h === "url" || h === "web" || h === "website/social" ||
    h === "social" || h === "social media" || h === "instagram" ||
    h.includes("website") || h.includes("url") || h.includes("social")
  ) {
    const confidence: Confidence = (h === "website" || h === "url" || h === "website/social") ? "high" : "suggestion";
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

function ConfidenceBadge({ confidence, isIgnore }: { confidence: Confidence; isIgnore?: boolean }) {
  if (isIgnore) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border-hover)]">
        ⚪ Extra Data (Stored in Raw Data)
      </span>
    );
  }
  if (confidence === "high")
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)]">
        🟢 High confidence
      </span>
    );
  if (confidence === "suggestion")
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]">
        🟡 Suggestion
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border-hover)]">
      ⚪ Extra Data (Stored in Raw Data)
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

  // Import settings (default false for fast instant import; can be toggled on)
  const [generateAiSnapshots, setGenerateAiSnapshots] = useState(false);
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

  // ─── Update a single column's mapping ────────────────────────────────────

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
      const addressHeader = getMappedHeader("address");
      const nicheHeader = getMappedHeader("niche");
      const keyServicesHeader = getMappedHeader("key_services");
      const ratingHeader = getMappedHeader("rating");
      const reviewCountHeader = getMappedHeader("review_count");
      const notesHeader = getMappedHeader("notes");

      return {
        business_name: (nameHeader && row[nameHeader]) || "Untitled Lead",
        website: websiteHeader ? row[websiteHeader] || null : null,
        phone: phoneHeader ? row[phoneHeader] || null : null,
        email: emailHeader ? row[emailHeader] || null : null,
        city: cityHeader ? row[cityHeader] || null : null,
        address: addressHeader ? row[addressHeader] || null : null,
        niche: nicheHeader
          ? row[nicheHeader] || null
          : keyServicesHeader
          ? row[keyServicesHeader] || null
          : null,
        key_services: keyServicesHeader ? row[keyServicesHeader] || null : null,
        rating: ratingHeader ? row[ratingHeader] || null : null,
        review_count: reviewCountHeader ? row[reviewCountHeader] || null : null,
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
    niche: getMappedHeader("niche")
      ? row[getMappedHeader("niche")!]
      : getMappedHeader("key_services")
      ? row[getMappedHeader("key_services")!]
      : "—",
    rating: getMappedHeader("rating") ? row[getMappedHeader("rating")!] : null,
    review_count: getMappedHeader("review_count") ? row[getMappedHeader("review_count")!] : null,
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
      <div className="pb-4 border-b border-[var(--border)]">
        <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
          <span>S2 — CSV Import (Lead Engine)</span>
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Bring raw lead data in safely. Raw rows remain immutable as the factual source of truth.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[var(--danger-soft)] border border-[var(--danger-border)] text-[var(--danger)] text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Step 1: Upload ── */}
      {step === "upload" && (
        <div className="p-8 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)] flex items-center justify-center mx-auto">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-heading text-base font-semibold text-[var(--text-primary)]">Select or drop your CSV file</h2>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto mt-1">
              Supports lead lists from Google Maps, Apollo, LinkedIn, or manual spreadsheets.
              Any column format is accepted — you will map columns manually before import.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold cursor-pointer transition-colors">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Choose CSV File</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      )}

      {/* ── Step 2: Column Mapping ── */}
      {step === "map" && (
        <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-heading text-base font-semibold text-[var(--text-primary)]">
                Map Columns — {fileName}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                For each column in your CSV, choose what system field it maps to.
                Columns set to &quot;Don&apos;t map&quot; are still saved in full — nothing is lost.
              </p>
            </div>
            <span className="flex-shrink-0 text-xs px-2.5 py-1 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]">
              {csvData.length} records
            </span>
          </div>

          {/* Saved template banner */}
          {savedTemplateDetected && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--success-soft)] border border-[var(--success-border)] text-xs text-[var(--success)]">
              <BookMarked className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Remembered mapping from a previous import</strong> — review each row and confirm before proceeding.
              </span>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-[11px] text-[var(--text-muted)] pb-1">
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
                  className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-3 p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)]"
                >
                  {/* Left: CSV column info */}
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--text-primary)] truncate">{guess.csvHeader}</div>
                    {previewVal !== undefined && previewVal !== "" && (
                      <div className="text-[11px] text-[var(--text-dim)] truncate mt-0.5">
                        e.g. &ldquo;{String(previewVal).slice(0, 60)}&rdquo;
                      </div>
                    )}
                    <div className="mt-1">
                      <ConfidenceBadge confidence={guess.confidence} isIgnore={guess.systemField === "ignore"} />
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-4 h-4 text-[var(--text-dim)] hidden md:block flex-shrink-0" />

                  {/* Right: System field dropdown */}
                  <select
                    value={guess.systemField}
                    onChange={(e) => updateMapping(guess.csvHeader, e.target.value as SystemField)}
                    className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
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
            <div className="flex items-center gap-2 text-xs text-[var(--danger)] p-3 rounded-lg bg-[var(--danger-soft)] border border-[var(--danger-border)]">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>You must map at least one column to <strong>Business Name</strong> before proceeding.</span>
            </div>
          )}

          {/* Template name */}
          <div className="space-y-1 pt-2 border-t border-[var(--border)]">
            <label className="text-xs font-medium text-[var(--text-muted)]">
              Template name (saved to database for future imports)
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Google Maps Export, Apollo Beauty Leads..."
              className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          {/* Nav buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep("upload")}
              className="px-4 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep("preview")}
              disabled={!canProceed}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              <span>Next: Preview Data</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Preview ── */}
      {step === "preview" && (
        <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-base font-semibold text-[var(--text-primary)]">Preview First 10 Rows</h2>
              <p className="text-xs text-[var(--text-muted)]">Confirm your column alignment before creating records.</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]">
              Total to import: {csvData.length}
            </span>
          </div>

          <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
            <table className="w-full text-left text-xs text-[var(--text-secondary)]">
              <thead className="bg-[var(--surface-hover)] text-[var(--text-muted)] border-b border-[var(--border)]">
                <tr>
                  <th className="p-2.5">Business Name</th>
                  <th className="p-2.5">Niche / Services</th>
                  <th className="p-2.5">Rating</th>
                  <th className="p-2.5">City / Location</th>
                  <th className="p-2.5">Phone</th>
                  <th className="p-2.5">Website / Social</th>
                  <th className="p-2.5 text-[var(--text-dim)]">Extra Data (stored)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {previewRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[var(--surface-hover)]">
                    <td className="p-2.5 font-medium text-[var(--text-primary)]">{row.business_name || "Untitled"}</td>
                    <td className="p-2.5 text-[var(--text-muted)]">{row.niche || "—"}</td>
                    <td className="p-2.5 text-[var(--accent)] font-medium">
                      {row.rating ? (
                        <span>⭐ {row.rating} {row.review_count ? `(${row.review_count})` : ""}</span>
                      ) : (
                        <span className="text-[var(--text-dim)]">—</span>
                      )}
                    </td>
                    <td className="p-2.5 text-[var(--text-muted)]">{row.city || "—"}</td>
                    <td className="p-2.5 text-[var(--text-muted)]">{row.phone || "—"}</td>
                    <td className="p-2.5 text-[var(--text-muted)] max-w-[150px] truncate">{row.website || "—"}</td>
                    <td className="p-2.5 text-[var(--text-dim)] text-[11px]">
                      {row.extraKeys.length > 0
                        ? row.extraKeys.join(", ")
                        : <span className="text-[var(--text-dim)]">none</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI snapshot toggle */}
          <div className="p-4 rounded-lg bg-[var(--surface-hover)] border border-[var(--accent-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[var(--accent)]" />
              <div>
                <div className="text-xs font-semibold text-[var(--text-primary)]">
                  Generate AI Business Snapshot for imported leads
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Extracts facts and strategic angles in the background without slowing down import.
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={generateAiSnapshots}
              onChange={(e) => setGenerateAiSnapshots(e.target.checked)}
              className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            <button
              onClick={() => setStep("map")}
              className="px-4 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Change Mapping
            </button>
            <button
              onClick={executeImport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-[var(--success)]/20 transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Confirm Import ({csvData.length} Leads)</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Importing ── */}
      {step === "importing" && (
        <div className="p-12 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-4">
          <Loader2 className="w-10 h-10 text-[var(--accent)] animate-spin mx-auto" />
          <h2 className="font-heading text-base font-semibold text-[var(--text-primary)]">Importing leads and running duplicate check...</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Writing verified records to PostgreSQL and saving mapping template for future imports.
          </p>
        </div>
      )}

      {/* ── Step 5: Done ── */}
      {step === "done" && importResult && (
        <div className="p-8 rounded-xl bg-[var(--surface)] border border-[var(--success-border)] text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="font-heading text-xl font-bold text-[var(--text-primary)]">Import Completed Successfully!</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {importResult.imported_count} new leads were added with status <strong>Imported</strong>.
              {importResult.duplicate_count > 0 && (
                <span className="text-[var(--accent)] block mt-1">
                  ({importResult.duplicate_count} duplicates were skipped based on matching website/phone/email).
                </span>
              )}
            </p>
            <p className="text-xs text-[var(--success)] mt-2">
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
              className="px-4 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-medium transition-colors"
            >
              Import Another File
            </button>
            <button
              onClick={() => router.push("/leads")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold transition-colors"
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
