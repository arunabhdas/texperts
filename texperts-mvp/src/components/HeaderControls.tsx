"use client";

import { useState } from "react";
import { useSimulationStore } from "@/store/useSimulationStore";
import SettingsPanel from "./SettingsPanel";

export default function HeaderControls() {
  const [showSettings, setShowSettings] = useState(false);
  const {
    status,
    tick,
    speed,
    setSpeed,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stepSimulation,
    events,
  } = useSimulationStore();

  const handlePlayPause = async () => {
    if (status === "stopped") {
      await startSimulation();
      await resumeSimulation();
    } else if (status === "paused") {
      await resumeSimulation();
    } else {
      await pauseSimulation();
    }
  };

  const handleExport = () => {
    const data = JSON.stringify({ tick, events }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `texperts-log-tick${tick}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handlePlayPause}
          className="px-3 py-1 rounded text-xs font-medium bg-[#342d3d] hover:bg-[#3d3548] text-[#e8dfd0] transition-colors"
        >
          {status === "running" ? "Pause" : status === "paused" ? "Resume" : "Start"}
        </button>

        <button
          onClick={stepSimulation}
          disabled={status === "running"}
          className="px-3 py-1 rounded text-xs font-medium bg-[#342d3d] hover:bg-[#3d3548] text-[#e8dfd0] disabled:opacity-40 transition-colors"
        >
          Step
        </button>

        {/* Speed selector */}
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="bg-[#2a2433] text-xs text-[#e8dfd0] rounded px-1.5 py-1 border border-[#3d3548]"
        >
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
        </select>

        <span className="text-xs text-[#a89e8c] ml-2">
          Tick: {tick} | {status}
        </span>

        <button
          onClick={handleExport}
          disabled={events.length === 0}
          className="px-3 py-1 rounded text-xs font-medium bg-[#342d3d] hover:bg-[#3d3548] text-[#e8dfd0] disabled:opacity-40 transition-colors ml-2"
        >
          Export
        </button>

        <button
          onClick={() => setShowSettings(true)}
          className="px-3 py-1 rounded text-xs font-medium bg-[#342d3d] hover:bg-[#3d3548] text-[#e8dfd0] transition-colors ml-2"
        >
          Settings
        </button>
      </div>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </>
  );
}
