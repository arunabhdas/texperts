"use client";

import { useSimulationStore } from "@/store/useSimulationStore";

export default function ControlPanel() {
  const {
    status,
    tick,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stepSimulation,
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

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePlayPause}
        className="px-3 py-1 rounded text-xs font-medium bg-gray-700 hover:bg-gray-600 transition-colors"
      >
        {status === "running" ? "Pause" : status === "paused" ? "Resume" : "Start"}
      </button>

      <button
        onClick={stepSimulation}
        disabled={status === "running"}
        className="px-3 py-1 rounded text-xs font-medium bg-gray-700 hover:bg-gray-600 disabled:opacity-40 transition-colors"
      >
        Step
      </button>

      <span className="text-xs text-gray-500 ml-2">
        Tick: {tick} | {status}
      </span>
    </div>
  );
}
