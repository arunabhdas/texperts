import { NextRequest, NextResponse } from "next/server";
import { getSimulationState } from "@/simulation/SimulationState";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const state = getSimulationState();

  try {
    const body = await request.json();
    const { text, target, as_inner_voice } = body as {
      text: string;
      target?: string;
      as_inner_voice?: boolean;
    };

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    // Deliver the injection as a perception to target agent(s)
    const agents = target
      ? [state.agents.get(target)].filter(Boolean)
      : Array.from(state.agents.values());

    const prefix = as_inner_voice
      ? "[Inner voice] "
      : "[Moderator announcement] ";

    for (const agent of agents) {
      if (!agent) continue;
      agent.addObservation(
        state.tick,
        `${prefix}${text}`,
        8, // high importance
        agent.currentZone ?? undefined,
      );
    }

    // Log the injection event
    state.eventLog.add({
      tick: state.tick,
      type: "injection",
      content: `${as_inner_voice ? "Inner voice" : "Moderator"}: ${text}`,
      agentName: target || "all",
    });

    // Broadcast injection event via SSE
    state.broadcast({
      type: "tick",
      payload: { tick: state.tick, simulation_time: `Tick ${state.tick}` },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
