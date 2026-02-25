import { NextRequest, NextResponse } from "next/server";
import { getSimulationState } from "@/simulation/SimulationState";
import { Orchestrator } from "@/simulation/Orchestrator";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const state = getSimulationState();

  if (state.status === "stopped") {
    return NextResponse.json({ success: false, error: "Simulation not initialized" }, { status: 400 });
  }

  // Get API key from header (user-provided) or fallback to env
  const apiKey = request.headers.get("x-api-key") || undefined;

  state.status = "running";
  const orchestrator = new Orchestrator(state, apiKey);
  orchestrator.startLoop(3000);

  return NextResponse.json({ success: true, status: state.status });
}
