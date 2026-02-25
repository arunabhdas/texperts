"use client";

import { useEffect, useState, useCallback } from "react";
import { useSimulationStore } from "@/store/useSimulationStore";
import { EventBus } from "@/game/EventBus";
import { MemoryEntry } from "@/types";

interface AgentMemoryData {
  memories: MemoryEntry[];
  currentPlan: string | null;
  emotion: string;
  currentZone: string | null;
  persona: string;
}

export default function AgentInspector() {
  const { selectedAgentId, setSelectedAgent, agents } = useSimulationStore();
  const [memoryData, setMemoryData] = useState<AgentMemoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"memory" | "plan">("memory");

  // Listen for agent selection from Phaser
  useEffect(() => {
    const handler = (...args: unknown[]) => {
      setSelectedAgent(args[0] as string);
    };
    EventBus.on("agent-selected", handler);
    return () => {
      EventBus.off("agent-selected", handler);
    };
  }, [setSelectedAgent]);

  // Fetch memory when agent is selected
  const fetchMemory = useCallback(async (agentId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/memory`);
      if (res.ok) {
        const data = await res.json();
        setMemoryData(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAgentId) {
      fetchMemory(selectedAgentId);
    } else {
      setMemoryData(null);
    }
  }, [selectedAgentId, fetchMemory]);

  // Auto-refresh every 5 seconds while selected
  useEffect(() => {
    if (!selectedAgentId) return;
    const interval = setInterval(() => fetchMemory(selectedAgentId), 5000);
    return () => clearInterval(interval);
  }, [selectedAgentId, fetchMemory]);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  if (!selectedAgentId || !selectedAgent) {
    return (
      <div className="h-full flex flex-col">
        <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
          Agent Inspector
        </div>
        <p className="text-xs text-gray-600">
          Click an agent to inspect their memory and plans.
        </p>
      </div>
    );
  }

  const emotionColor: Record<string, string> = {
    confident: "text-green-400",
    uncertain: "text-yellow-400",
    skeptical: "text-red-400",
    excited: "text-emerald-400",
    alarmed: "text-orange-400",
    neutral: "text-gray-400",
    amused: "text-purple-400",
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Agent Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: selectedAgent.color }}
          />
          <div>
            <div className="text-sm font-medium">{selectedAgent.name}</div>
            <div className="text-xs text-gray-500">{selectedAgent.role}</div>
          </div>
        </div>
        <button
          onClick={() => setSelectedAgent(null)}
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          x
        </button>
      </div>

      {/* Status */}
      <div className="flex items-center gap-3 mb-2 text-xs">
        <span className={emotionColor[selectedAgent.emotion] || "text-gray-400"}>
          {selectedAgent.emotion}
        </span>
        <span className="text-gray-600">|</span>
        <span className="text-gray-400">{selectedAgent.status}</span>
        {selectedAgent.currentZone && (
          <>
            <span className="text-gray-600">|</span>
            <span className="text-gray-500">{selectedAgent.currentZone}</span>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-2">
        <button
          onClick={() => setTab("memory")}
          className={`px-2 py-0.5 text-xs rounded ${
            tab === "memory" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Memory
        </button>
        <button
          onClick={() => setTab("plan")}
          className={`px-2 py-0.5 text-xs rounded ${
            tab === "plan" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Plan
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && <p className="text-xs text-gray-600">Loading...</p>}

        {tab === "memory" && memoryData && (
          <div className="space-y-1">
            {memoryData.memories.length === 0 && (
              <p className="text-xs text-gray-600">No memories yet.</p>
            )}
            {memoryData.memories.map((mem) => (
              <div
                key={mem.id}
                className={`text-xs p-1.5 rounded border ${
                  mem.type === "reflection"
                    ? "border-purple-800 bg-purple-900/20"
                    : mem.type === "plan"
                      ? "border-blue-800 bg-blue-900/20"
                      : "border-gray-800 bg-gray-900/50"
                }`}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <span
                    className={`text-[10px] uppercase font-medium ${
                      mem.type === "reflection"
                        ? "text-purple-400"
                        : mem.type === "plan"
                          ? "text-blue-400"
                          : "text-gray-500"
                    }`}
                  >
                    {mem.type}
                  </span>
                  <span className="text-[10px] text-gray-600">t{mem.tick}</span>
                  <span className="text-[10px] text-gray-600">imp:{mem.importance}</span>
                </div>
                <div className="text-gray-300 leading-tight">{mem.content}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "plan" && (
          <div className="space-y-2">
            <div>
              <div className="text-[10px] uppercase text-gray-500 mb-1">Current Plan</div>
              <p className="text-xs text-gray-300">
                {memoryData?.currentPlan || selectedAgent.currentPlan || "No current plan."}
              </p>
            </div>
            {memoryData?.persona && (
              <div>
                <div className="text-[10px] uppercase text-gray-500 mb-1">Persona</div>
                <p className="text-xs text-gray-500 leading-tight">{memoryData.persona}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
