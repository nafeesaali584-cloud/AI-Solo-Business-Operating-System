"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { useBusinessBrain } from "@/context/BusinessBrainContext";

interface ColumnMapping {
  business_name: string;
  website: string;
  phone: string;
  email: string;
  city: string;
  niche: string;
  notes: string;
}

export default function CsvImportPage() {
  const router = useRouter();
  const { setActiveEntity } = useBusinessBrain();

  const [step, setStep] = useState<"upload" | "map" | "preview" | "importing" | "done">("upload");
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<ColumnMapping>({
    business_name: "",
    website: "",
    phone: "",
    email: "",
    city: "",
    niche: "",
    notes: "",
  });
  const [generateAiSnapshots, setGenerateAiSnapshots] = useState(true);
  const [importResult, setImportResult] = useState<{
    imported_count: number;
    duplicate_count: number;
    duplicates: any[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setErrorMsg("The uploaded CSV file is empty.");
          return;
        }

        const detectedHeaders = results.meta.fields || Object.keys(results.data[0] || {});
        setHeaders(detectedHeaders);
        setCsvData(results.data);

        // Auto-guess column mapping
        const autoMap: ColumnMapping = {
          business_name: "",
          website: "",
          phone: "",
          email: "",
          city: "",
          niche: "",
          notes: "",
        };

        detectedHeaders.forEach((h) => {
          const lower = h.toLowerCase();
          if (lower.includes("name") || lower.includes("company") || lower.includes("business")) {
            if (!autoMap.business_name) autoMap.business_name = h;
          } else if (lower.includes("site") || lower.includes("url") || lower.includes("web")) {
            if (!autoMap.website) autoMap.website = h;
          } else if (lower.includes("phone") || lower.includes("mobile") || lower.includes("tel")) {
            if (!autoMap.phone) autoMap.phone = h;
          } else if (lower.includes("mail")) {
            if (!autoMap.email) autoMap.email = h;
          } else if (lower.includes("city") || lower.includes("country") || lower.includes("location") || lower.includes("address")) {
            if (!autoMap.city) autoMap.city = h;
          } else if (lower.includes("niche") || lower.includes("industry") || lower.includes("category")) {
            if (!autoMap.niche) autoMap.niche = h;
          } else if (lower.includes("note") || lower.includes("desc") || lower.includes("comment")) {
            if (!autoMap.notes) autoMap.notes = h;
          }
        });

        // Default business_name to first column if not guessed
        if (!autoMap.business_name && detectedHeaders.length > 0) {
          autoMap.business_name = detectedHeaders[0];
        }

        setMapping(autoMap);
        setStep("map");
      },
      error: (err) => {
        setErrorMsg(`Failed to parse CSV: ${err.message}`);
      },
    });
  };

  const executeImport = async () => {
    setStep("importing");
    setErrorMsg("");

    try {
      // Map rows according to user's selections
      const mappedRows = csvData.map((row) => {
        return {
          business_name: row[mapping.business_name] || "Untitled Lead",
          website: mapping.website ? row[mapping.website] : null,
          phone: mapping.phone ? row[mapping.phone] : null,
          email: mapping.email ? row[mapping.email] : null,
          city: mapping.city ? row[mapping.city] : null,
          niche: mapping.niche ? row[mapping.niche] : null,
          notes: mapping.notes ? row[mapping.notes] : null,
          source_csv_row: row, // Immutable raw data stored in DB
        };
      });

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
        throw new Error(errJson.error || "Import failed");
      }

      const result = await res.json();
      setImportResult(result);
      setStep("done");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process import");
      setStep("preview");
    }
  };

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

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="p-8 rounded-xl bg-[#141417] border border-[#26262e] text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-200">Select or drop your CSV file</h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
              Supports lead lists from Google Maps, Apollo, LinkedIn, or manual spreadsheets.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold cursor-pointer transition">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Choose CSV File</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === "map" && (
        <div className="p-6 rounded-xl bg-[#141417] border border-[#26262e] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-200">Map Columns ({fileName})</h2>
              <p className="text-xs text-zinc-400">
                Match CSV column headers to ClientPulse system fields. Unmapped columns are safely stored in raw data.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-300">
              {csvData.length} records found
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "business_name", label: "Business Name * (Required)", required: true },
              { key: "website", label: "Website URL" },
              { key: "phone", label: "Phone / WhatsApp" },
              { key: "email", label: "Email Address" },
              { key: "city", label: "City / Country / Location" },
              { key: "niche", label: "Niche / Industry" },
              { key: "notes", label: "Notes / Context" },
            ].map(({ key, label, required }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">{label}</label>
                <select
                  value={(mapping as any)[key]}
                  onChange={(e) =>
                    setMapping({ ...mapping, [key]: e.target.value })
                  }
                  className="w-full bg-[#1b1b22] border border-[#2c2c36] rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-amber-500 transition"
                >
                  <option value="">-- Do Not Map --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <button
              onClick={() => setStep("upload")}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Back
            </button>
            <button
              onClick={() => setStep("preview")}
              disabled={!mapping.business_name}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold disabled:opacity-50 transition"
            >
              <span>Next: Preview Data</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview (First 10 Rows) */}
      {step === "preview" && (
        <div className="p-6 rounded-xl bg-[#141417] border border-[#26262e] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-200">Preview First 10 Rows</h2>
              <p className="text-xs text-zinc-400">
                Confirm your column alignment before creating records.
              </p>
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
                  <th className="p-2.5">Niche</th>
                  <th className="p-2.5">City</th>
                  <th className="p-2.5">Phone</th>
                  <th className="p-2.5">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {csvData.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/30">
                    <td className="p-2.5 font-medium text-zinc-200">
                      {row[mapping.business_name] || "Untitled"}
                    </td>
                    <td className="p-2.5 text-zinc-400">
                      {mapping.niche ? row[mapping.niche] : "—"}
                    </td>
                    <td className="p-2.5 text-zinc-400">
                      {mapping.city ? row[mapping.city] : "—"}
                    </td>
                    <td className="p-2.5 text-zinc-400">
                      {mapping.phone ? row[mapping.phone] : "—"}
                    </td>
                    <td className="p-2.5 text-zinc-400">
                      {mapping.email ? row[mapping.email] : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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

      {/* Step 4: In Progress */}
      {step === "importing" && (
        <div className="p-12 rounded-xl bg-[#141417] border border-[#26262e] text-center space-y-4">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
          <h2 className="text-base font-semibold text-zinc-200">Importing leads and running duplicate check...</h2>
          <p className="text-xs text-zinc-400">
            Writing verified records to PostgreSQL database and generating intelligence snapshots.
          </p>
        </div>
      )}

      {/* Step 5: Done */}
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
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => {
                setStep("upload");
                setCsvData([]);
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
