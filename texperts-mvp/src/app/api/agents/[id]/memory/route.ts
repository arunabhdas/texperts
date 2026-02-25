import { NextRequest, NextResponse } from "next/server";
import { getSimulationState } from "@/simulation/SimulationState";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const state = getSimulationState();
  const agent = state.agents.get(params.id);

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json({
    memories: agent.memory.getAll().slice(0, 50), // last 50
    currentPlan: agent.currentPlan,
    emotion: agent.emotion,
    currentZone: agent.currentZone,
    persona: agent.persona,
  });
}
