"use client";

import { useState } from "react";
import { apiFetch } from "../lib/api";
import { Log } from "../../logging-middleware/src/index";

type Row = { originalUrl: string; validityMinutes: string; preferredShortcode: string };
type Result = { originalUrl: string; shortUrl?: string; expiresAt?: string; error?: string; shortcode?: string };

export default function Home() {
  const [rows, setRows] = useState<Row[]>(
    Array.from({ length: 5 }, () => ({ originalUrl: "", validityMinutes: "", preferredShortcode: "" }))
  );
  const [results, setResults] = useState<Result[] | null>(null);
  const [busy, setBusy] = useState(false);

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function validateRow(r: Row) {
    if (!r.originalUrl) return "Original URL required";
    try {
      const u = new URL(r.originalUrl);
      if (!["http:", "https:"].includes(u.protocol)) return "Invalid protocol";
    } catch {
      return "Invalid URL format";
    }
    if (r.validityMinutes) {
      const n = Number(r.validityMinutes);
      if (!Number.isInteger(n) || n < 0) return "validityMinutes must be non-negative integer";
    }
    if (r.preferredShortcode) {
      if (!/^[A-Za-z0-9_-]{4,12}$/.test(r.preferredShortcode)) return "shortcode must be 4-12 alnum/_/-";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResults(null);

    const payloadItems = [];
    for (const r of rows) {
      if (!r.originalUrl) continue;
      const err = validateRow(r);
      if (err) {
        setResults([{ originalUrl: r.originalUrl, error: err }]);
        return;
      }
      payloadItems.push({
        originalUrl: r.originalUrl,
        validityMinutes: r.validityMinutes ? parseInt(r.validityMinutes) : undefined,
        preferredShortcode: r.preferredShortcode || undefined,
      });
    }
    if (payloadItems.length === 0) {
      setResults([{ originalUrl: "", error: "Add at least one URL" }]);
      return;
    }

    setBusy(true);
    try {
      await Log("frontend", "info", "shorten-page", "Submitting URLs", { count: payloadItems.length });
      const data = await apiFetch("/api/shorten", {
        method: "POST",
        body: JSON.stringify({ items: payloadItems }),
      });
      setResults(data.results);
      await Log("frontend", "info", "shorten-page", "Shorten success", data.results);
    } catch (err: any) {
      setResults([{ originalUrl: "", error: err.message }]);
      await Log("frontend", "error", "shorten-page", "Shorten failed", { error: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">URL Shortener (up to 5 URLs)</h1>
      <form onSubmit={handleSubmit}>
        {rows.map((r, i) => (
          <div key={i} className="border rounded p-3 mb-3">
            <label className="block text-sm">Original URL</label>
            <input
              className="w-full p-2 border rounded"
              value={r.originalUrl}
              onChange={(e) => updateRow(i, { originalUrl: e.target.value })}
            />
            <div className="flex gap-3 mt-2">
              <div>
                <label className="block text-sm">Validity (minutes)</label>
                <input
                  className="p-2 border rounded"
                  value={r.validityMinutes}
                  onChange={(e) => updateRow(i, { validityMinutes: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm">Preferred shortcode</label>
                <input
                  className="p-2 border rounded"
                  value={r.preferredShortcode}
                  onChange={(e) => updateRow(i, { preferredShortcode: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}
        <div className="flex gap-3">
          <button type="submit" disabled={busy} className="px-4 py-2 bg-blue-600 text-white rounded">
            {busy ? "Working..." : "Shorten"}
          </button>
          <a href="/stats" className="px-4 py-2 border rounded">
            View Stats
          </a>
        </div>
      </form>

      {results && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Results</h2>
          <ul className="space-y-2 mt-3">
            {results.map((r, idx) => (
              <li key={idx} className="p-2 border rounded">
                <div>
                  <strong>Original:</strong> {r.originalUrl || "[empty]"}
                </div>
                {r.error && <div className="text-red-600">Error: {r.error}</div>}
                {r.shortUrl && (
                  <>
                    <div>
                      <strong>Short:</strong>{" "}
                      <a href={r.shortUrl} target="_blank" rel="noreferrer">
                        {r.shortUrl}
                      </a>
                    </div>
                    <div>
                      <strong>Expires:</strong> {r.expiresAt || "Never"}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
