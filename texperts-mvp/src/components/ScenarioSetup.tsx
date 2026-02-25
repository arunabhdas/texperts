"use client";

import { useState } from "react";

interface ScenarioSetupProps {
  onStart: () => void;
}

const AGENT_SUMMARIES = [
  { name: "The Visionary", role: "CEO", color: "#6BB86E", desc: "Bold thinker, sees massive TAM" },
  { name: "The Skeptic", role: "CFO", color: "#C4706A", desc: "Demands evidence, challenges assumptions" },
  { name: "The Builder", role: "CTO", color: "#6A9FC4", desc: "Pragmatic engineer, honest about timelines" },
  { name: "The Whisperer", role: "Product", color: "#D4BA6A", desc: "Customer expert, data-driven insights" },
  { name: "Devil's Advocate", role: "Advisor", color: "#9E72B4", desc: "Challenges consensus, finds blind spots" },
];

export default function ScenarioSetup({ onStart }: ScenarioSetupProps) {
  const [ready, setReady] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#211c28] border border-[#3d3548] rounded-lg max-w-2xl w-full mx-4 p-6">
        <h2 className="text-xl font-bold mb-1 text-[#d4a857]">texperts.ai</h2>
        <p className="text-sm text-[#a89e8c] mb-4">
          Multi-Agent Strategic Simulation
        </p>

        <div className="border border-[#2f2938] rounded p-4 mb-4 bg-[#1a1520]">
          <h3 className="text-sm font-medium mb-2 text-[#e8dfd0]">Scenario: B2B to B2C Pivot</h3>
          <p className="text-xs text-[#a89e8c] leading-relaxed">
            The board has asked the leadership team to evaluate whether the company should pivot
            from its B2B SaaS model to a B2C consumer product. The B2B business generates $2M ARR
            with 15% MoM growth, but the consumer opportunity could be 100x larger.
            The company has $5M in runway.
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-xs uppercase tracking-wider text-[#a89e8c] mb-2">Expert Panel</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AGENT_SUMMARIES.map((agent) => (
              <div key={agent.name} className="flex items-start gap-2 p-2 border border-[#3d3548] rounded">
                <div
                  className="w-3 h-3 rounded-full mt-0.5 shrink-0"
                  style={{ backgroundColor: agent.color }}
                />
                <div>
                  <div className="text-xs font-medium text-[#e8dfd0]">{agent.name}</div>
                  <div className="text-[10px] text-[#a89e8c]">{agent.role}</div>
                  <div className="text-[10px] text-[#7a7068]">{agent.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[#a89e8c]">
            <input
              type="checkbox"
              checked={ready}
              onChange={(e) => setReady(e.target.checked)}
              className="accent-[#d4a857]"
            />
            I understand this uses Claude API credits
          </label>
        </div>

        <button
          onClick={onStart}
          disabled={!ready}
          className="mt-4 w-full py-2 rounded font-medium text-sm bg-[#4A8A4D] hover:bg-[#5a9a5d] text-[#e8dfd0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Start Simulation
        </button>

        <p className="text-[10px] text-[#7a7068] mt-2 text-center">
          No API key? The simulation will run with scripted demo responses.
        </p>
      </div>
    </div>
  );
}
