import { NextResponse } from "next/server";
import { getSimulationState } from "@/simulation/SimulationState";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = getSimulationState();
  const agents = Array.from(state.agents.values()).map((a) => a.getState());
  return NextResponse.json({ agents });
}
