import { NextResponse } from "next/server";
import { getSimulationState } from "@/simulation/SimulationState";

export const dynamic = "force-dynamic";

export async function POST() {
  const state = getSimulationState();
  state.initialize();

  return NextResponse.json({
    success: true,
    snapshot: state.getSnapshot(),
  });
}
