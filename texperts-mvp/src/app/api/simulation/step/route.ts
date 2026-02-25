import { NextRequest, NextResponse } from "next/server";
import { getSimulationState } from "@/simulation/SimulationState";
import { Orchestrator } from "@/simulation/Orchestrator";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const state = getSimulationState();

  if (state.status === "stopped") {
    return NextResponse.json({ success: false, error: "Simulation not initialized" }, { status: 400 });
  }

  const apiKey = request.headers.get("x-api-key") || undefined;

  state.status = "paused";
  const orchestrator = new Orchestrator(state, apiKey);
  const messages = await orchestrator.step();

  return NextResponse.json({
    success: true,
    tick: state.tick,
    messages,
    snapshot: state.getSnapshot(),
  });
}
