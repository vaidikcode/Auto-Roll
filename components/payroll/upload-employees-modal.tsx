"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, Download } from "lucide-react";

interface UploadEmployeesModalProps {
  runId: string;
  open: boolean;
  onClose: () => void;
  onUploaded: (count: number) => void;
}

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

const SAMPLE_CSV = `name,email,country,currency,base_salary_usd,employment_type,state,department,title
John Smith,john.smith@example.com,US,USD,95000,domestic,NY,Engineering,Software Engineer
Maria Garcia,m.garcia@example.com,ES,EUR,58000,international,,Design,Product Designer
Yuki Tanaka,y.tanaka@example.com,JP,JPY,72000,international,,Engineering,Backend Engineer`;

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "auto-roll-employees-sample.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function UploadEmployeesModal({
  runId,
  open,
  onClose,
  onUploaded,
}: UploadEmployeesModalProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setState("idle");
    setFile(null);
    setResult(null);
    setErrorMsg(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setState("idle");
    setErrorMsg(null);
    setResult(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setState("idle");
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!file) return;
    setState("uploading");
    setErrorMsg(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`/api/runs/${runId}/upload-employees`, {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        setErrorMsg(data.error ?? "Upload failed.");
        return;
      }
      setState("success");
      setResult({ inserted: data.inserted, skipped: data.skipped });
      onUploaded(data.inserted);
    } catch {
      setState("error");
      setErrorMsg("Network error — please try again.");
    }
  };

  if (!open) return null;

  const ext = file?.name.split(".").pop()?.toUpperCase() ?? "";
  const isUploading = state === "uploading";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-white border-2 border-zinc-900 shadow-[6px_6px_0_0_#18181b]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-zinc-900 bg-zinc-50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 border-2 border-zinc-900 bg-[color:var(--vault-accent)] flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4 text-zinc-900" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wide text-zinc-900">
                Import Employees
              </h2>
              <p className="text-[10px] text-zinc-500 mt-0.5">CSV · Excel (.xlsx / .xls)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="h-7 w-7 flex items-center justify-center border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-zinc-600" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Drop zone */}
          {state !== "success" && (
            <div
              onDragOver={(e) => { e.preventDefault(); setState("dragging"); }}
              onDragLeave={() => setState("idle")}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-none p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
                state === "dragging"
                  ? "border-zinc-900 bg-zinc-50"
                  : file
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-300 hover:border-zinc-500 hover:bg-zinc-50/50"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.ods"
                className="sr-only"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              {file ? (
                <>
                  <div className="h-10 w-10 border-2 border-zinc-900 bg-zinc-900 flex items-center justify-center">
                    <FileSpreadsheet className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-zinc-900">{file.name}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {ext} · {(file.size / 1024).toFixed(1)} KB — click to replace
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-10 w-10 border-2 border-zinc-300 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-zinc-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-zinc-700">
                      Drop your file here, or click to browse
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      CSV, XLSX, XLS, or ODS · up to 10 MB
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Success state */}
          {state === "success" && result && (
            <div className="border-2 border-zinc-900 p-6 flex flex-col items-center gap-3 text-center bg-zinc-50">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-sm font-black text-zinc-900 uppercase tracking-wide">
                  {result.inserted} employee{result.inserted === 1 ? "" : "s"} imported
                </p>
                {result.skipped > 0 && (
                  <p className="text-[10px] text-zinc-500 mt-1">
                    {result.skipped} row{result.skipped === 1 ? "" : "s"} skipped (missing name or email)
                  </p>
                )}
              </div>
              <p className="text-xs text-zinc-600">
                Run payroll to include them in this cycle.
              </p>
            </div>
          )}

          {/* Error */}
          {state === "error" && errorMsg && (
            <div className="flex items-start gap-2 p-3 border border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{errorMsg}</p>
            </div>
          )}

          {/* Required columns hint */}
          {state !== "success" && (
            <div className="text-[10px] text-zinc-500 space-y-1">
              <p className="font-semibold uppercase tracking-wide text-zinc-600">Required columns</p>
              <div className="flex flex-wrap gap-1.5">
                {["name", "email"].map((c) => (
                  <code key={c} className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 text-zinc-700 text-[10px]">
                    {c}
                  </code>
                ))}
                <span className="text-zinc-400">·</span>
                {["country", "base_salary_usd", "employment_type", "currency", "state", "department", "title"].map((c) => (
                  <code key={c} className="px-1.5 py-0.5 bg-zinc-50 border border-zinc-200 text-zinc-500 text-[10px]">
                    {c}
                  </code>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={downloadSample}
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              <Download className="h-3 w-3" />
              Download sample CSV
            </button>

            <div className="flex gap-2">
              {state === "success" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="!bg-zinc-900 !text-white border-2 border-zinc-900 rounded-none font-black uppercase text-[10px] tracking-wide h-9 px-5 hover:!bg-zinc-800"
                >
                  Done
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="border-2 border-zinc-300 rounded-none font-bold uppercase text-[10px] tracking-wide h-9 px-4 text-zinc-600 hover:border-zinc-900 hover:!text-zinc-900"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className="!bg-zinc-900 !text-white border-2 border-zinc-900 rounded-none font-black uppercase text-[10px] tracking-wide h-9 px-5 hover:!bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {isUploading ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Importing…
                      </span>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5" />
                        Import
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
