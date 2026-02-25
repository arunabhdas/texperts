"use client";

import { useState } from "react";
import { useSimulationStore } from "@/store/useSimulationStore";

const API_KEY_STORAGE = "texperts_api_key";

function getApiHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const key = localStorage.getItem(API_KEY_STORAGE);
    if (key) headers["x-api-key"] = key;
  }
  return headers;
}

export default function PromptInjector() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"moderator" | "inner_voice">("moderator");
  const [targetAgent, setTargetAgent] = useState<string>("all");
  const [sending, setSending] = useState(false);
  const agents = useSimulationStore((s) => s.agents);

  const handleInject = async () => {
    if (!text.trim()) return;

    setSending(true);
    try {
      await fetch("/api/simulation/inject", {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify({
          text: text.trim(),
          target: targetAgent === "all" ? undefined : targetAgent,
          as_inner_voice: mode === "inner_voice",
        }),
      });
      setText("");
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleInject();
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <button
            onClick={() => setMode("moderator")}
            className={`px-2 py-0.5 text-[10px] rounded ${
              mode === "moderator"
                ? "bg-[#8a5a30] text-[#e8dfd0]"
                : "bg-[#2a2433] text-[#7a7068] hover:text-[#e8dfd0]"
            }`}
          >
            Moderator
          </button>
          <button
            onClick={() => setMode("inner_voice")}
            className={`px-2 py-0.5 text-[10px] rounded ${
              mode === "inner_voice"
                ? "bg-[#5E3D6B] text-[#e8dfd0]"
                : "bg-[#2a2433] text-[#7a7068] hover:text-[#e8dfd0]"
            }`}
          >
            Inner Voice
          </button>
        </div>
        <select
          value={targetAgent}
          onChange={(e) => setTargetAgent(e.target.value)}
          className="bg-[#2a2433] text-xs text-[#e8dfd0] rounded px-1.5 py-0.5 border border-[#3d3548]"
        >
          <option value="all">All agents</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === "moderator"
              ? "Inject a prompt as moderator..."
              : "Whisper to agent's inner voice..."
          }
          className="flex-1 bg-[#2a2433] text-xs text-[#e8dfd0] rounded px-2 py-1.5 border border-[#3d3548] placeholder-[#7a7068] focus:outline-none focus:border-[#d4a857]"
        />
        <button
          onClick={handleInject}
          disabled={sending || !text.trim()}
          className="px-3 py-1 text-xs rounded bg-[#342d3d] hover:bg-[#3d3548] text-[#e8dfd0] disabled:opacity-40 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
