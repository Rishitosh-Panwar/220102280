"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { Log } from "../../../logging-middleware/src/index";

type Click = { timestamp: string; referer?: string; userAgent?: string; ip?: string; location?: string };
type Item = { shortcode: string; originalUrl: string; createdAt: string; expiresAt?: string | null; clicks: Click[] };

export default function StatsPage() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    async function load() {
      try {
        await Log("frontend", "info", "stats-page", "Fetching stats");
        const data = await apiFetch("/api/stats");
        setItems(data.items || []);
      } catch (err: any) {
        await Log("frontend", "error", "stats-page", "Stats fetch failed", { error: err.message });
      }
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Shortened URLs & Stats</h1>
      <div className="mt-4 space-y-4">
        {items.map((it) => (
          <div key={it.shortcode} className="border p-3 rounded">
            <div>
              <strong>Short:</strong>{" "}
              <a href={`${process.env.NEXT_PUBLIC_API_BASE}/${it.shortcode}`} target="_blank" rel="noreferrer">
                {it.shortcode}
              </a>
            </div>
            <div>
              <strong>Original:</strong> {it.originalUrl}
            </div>
            <div>
              <strong>Created:</strong> {it.createdAt}
            </div>
            <div>
              <strong>Expires:</strong> {it.expiresAt || "Never"}
            </div>
            <div>
              <strong>Clicks:</strong> {it.clicks.length}
            </div>

            <details className="mt-2">
              <summary className="cursor-pointer">Click details</summary>
              <ul className="mt-2">
                {it.clicks.map((c, i) => (
                  <li key={i} className="border p-2 rounded mt-2">
                    <div>
                      <strong>Time:</strong> {c.timestamp}
                    </div>
                    <div>
                      <strong>Source:</strong> {c.referer || c.userAgent || c.ip || "Unknown"}
                    </div>
                    <div>
                      <strong>Location:</strong> {c.location || "Unknown"}
                    </div>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
