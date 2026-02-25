"use client";

import { useState } from "react";

interface ScenarioSetupProps {
  onStart: () => void;
}

const AGENT_SUMMARIES = [
  { name: "The Visionary", role: "CEO", color: "#4CAF50", desc: "Bold thinker, sees massive TAM" },
  { name: "The Skeptic", role: "CFO", color: "#F44336", desc: "Demands evidence, challenges assumptions" },
  { name: "The Builder", role: "CTO", color: "#2196F3", desc: "Pragmatic engineer, honest about timelines" },
  { name: "The Whisperer", role: "Product", color: "#FFEB3B", desc: "Customer expert, data-driven insights" },
  { name: "Devil's Advocate", role: "Advisor", color: "#9C27B0", desc: "Challenges consensus, finds blind spots" },
];

export default function ScenarioSetup({ onStart }: ScenarioSetupProps) {
  const [ready, setReady] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full mx-4 p-6">
        <h2 className="text-xl font-bold mb-1">texperts.ai</h2>
        <p className="text-sm text-gray-400 mb-4">
          Multi-Agent Strategic Simulation
        </p>

        <div className="border border-gray-800 rounded p-4 mb-4 bg-gray-950">
          <h3 className="text-sm font-medium mb-2 text-gray-300">Scenario: B2B to B2C Pivot</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            The board has asked the leadership team to evaluate whether the company should pivot
            from its B2B SaaS model to a B2C consumer product. The B2B business generates $2M ARR
            with 15% MoM growth, but the consumer opportunity could be 100x larger.
            The company has $5M in runway.
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Expert Panel</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AGENT_SUMMARIES.map((agent) => (
              <div key={agent.name} className="flex items-start gap-2 p-2 border border-gray-800 rounded">
                <div
                  className="w-3 h-3 rounded-full mt-0.5 shrink-0"
                  style={{ backgroundColor: agent.color }}
                />
                <div>
                  <div className="text-xs font-medium">{agent.name}</div>
                  <div className="text-[10px] text-gray-500">{agent.role}</div>
                  <div className="text-[10px] text-gray-400">{agent.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={ready}
              onChange={(e) => setReady(e.target.checked)}
              className="accent-green-500"
            />
            I understand this uses Claude API credits
          </label>
        </div>

        <button
          onClick={onStart}
          disabled={!ready}
          className="mt-4 w-full py-2 rounded font-medium text-sm bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Start Simulation
        </button>

        <p className="text-[10px] text-gray-600 mt-2 text-center">
          No API key? The simulation will run with scripted demo responses.
        </p>
      </div>
    </div>
  );
}
