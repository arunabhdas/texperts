"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useSimulationStore } from "@/store/useSimulationStore";

const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen text-[#7a7068]">
      Loading simulation...
    </div>
  ),
});

const SimulationController = dynamic(
  () => import("@/components/SimulationController"),
  { ssr: false },
);

const HeaderControls = dynamic(() => import("@/components/HeaderControls"), {
  ssr: false,
});

const AgentInspector = dynamic(() => import("@/components/AgentInspector"), {
  ssr: false,
});

const EventLog = dynamic(() => import("@/components/EventLog"), {
  ssr: false,
});

const PromptInjector = dynamic(() => import("@/components/PromptInjector"), {
  ssr: false,
});

const ScenarioSetup = dynamic(() => import("@/components/ScenarioSetup"), {
  ssr: false,
});

export default function SimulationApp() {
  const [showSetup, setShowSetup] = useState(true);
  const { startSimulation, resumeSimulation } = useSimulationStore();

  const handleStart = async () => {
    setShowSetup(false);
    await startSimulation();
    await resumeSimulation();
  };

  return (
    <main className="flex flex-col h-screen">
      <SimulationController />

      {showSetup && <ScenarioSetup onStart={handleStart} />}

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-[#3d3548] bg-[#211c28]">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight text-[#d4a857]">texperts.ai</h1>
          <span className="text-xs text-[#a89e8c]">Multi-Agent Simulation</span>
        </div>
        <HeaderControls />
      </header>

      {/* Game area + side panel */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <GameCanvas />
        </div>

        <aside className="w-72 border-l border-[#3d3548] bg-[#211c28] p-3 hidden lg:block overflow-hidden">
          <AgentInspector />
        </aside>
      </div>

      {/* Bottom panel: Event Log + Prompt Injector */}
      <footer className="h-40 border-t border-[#3d3548] bg-[#211c28] p-3 flex gap-3">
        <div className="flex-1 overflow-hidden">
          <EventLog />
        </div>
        <div className="w-80 shrink-0 border-l border-[#3d3548] pl-3">
          <div className="text-xs text-[#a89e8c] mb-1 uppercase tracking-wider">
            Prompt Injection
          </div>
          <PromptInjector />
        </div>
      </footer>
    </main>
  );
}
