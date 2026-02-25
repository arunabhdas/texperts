import { NextResponse } from "next/server";
import { getSimulationState } from "@/simulation/SimulationState";

export const dynamic = "force-dynamic";

export async function POST() {
  const state = getSimulationState();
  state.status = "paused";
  return NextResponse.json({ success: true, status: state.status });
}
