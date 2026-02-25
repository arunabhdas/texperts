"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "texperts_api_key";

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<"idle" | "validating" | "valid" | "invalid">("idle");
  const [hasServerKey, setHasServerKey] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load saved key
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setApiKey(saved);
      setStatus("valid");
    }

    // Check if server has a key
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setHasServerKey(data.hasServerKey))
      .catch(() => {});
  }, []);

  const handleValidate = async () => {
    if (!apiKey.trim()) {
      setError("Please enter an API key");
      return;
    }

    setStatus("validating");
    setError("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const data = await res.json();

      if (data.valid) {
        localStorage.setItem(STORAGE_KEY, apiKey.trim());
        setStatus("valid");
      } else {
        setStatus("invalid");
        setError(data.error || "Invalid API key");
      }
    } catch {
      setStatus("invalid");
      setError("Failed to validate key");
    }
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey("");
    setStatus("idle");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#211c28] border border-[#3d3548] rounded-lg p-6 w-96 max-w-[90vw]">
        <h2 className="text-sm font-bold mb-4 text-[#e8dfd0]">API Settings</h2>

        {hasServerKey && (
          <div className="text-xs text-[#9ED8A0] mb-3 bg-[#4A8A4D]/15 rounded p-2">
            Server has a default API key configured. You can use that or provide your own.
          </div>
        )}

        <label className="text-xs text-[#a89e8c] block mb-1">
          Anthropic API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            setStatus("idle");
          }}
          placeholder="sk-ant-..."
          className="w-full bg-[#2a2433] border border-[#3d3548] rounded px-3 py-2 text-xs text-[#e8dfd0] mb-2 focus:border-[#d4a857] focus:outline-none"
        />

        {error && <p className="text-xs text-[#E8A49E] mb-2">{error}</p>}
        {status === "valid" && (
          <p className="text-xs text-[#9ED8A0] mb-2">Key validated successfully</p>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleValidate}
            disabled={status === "validating"}
            className="px-3 py-1.5 rounded text-xs font-medium bg-[#4A7A9E] hover:bg-[#5a8aae] text-[#e8dfd0] disabled:opacity-50"
          >
            {status === "validating" ? "Validating..." : "Save & Validate"}
          </button>
          {status === "valid" && (
            <button
              onClick={handleClear}
              className="px-3 py-1.5 rounded text-xs font-medium bg-[#342d3d] hover:bg-[#3d3548] text-[#e8dfd0]"
            >
              Clear Key
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs font-medium bg-[#342d3d] hover:bg-[#3d3548] text-[#e8dfd0] ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/** Get the stored API key (for use in API calls). */
export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}
