import { getSimulationState } from "@/simulation/SimulationState";
import { Orchestrator } from "@/simulation/Orchestrator";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel timeout

export async function GET() {
  const state = getSimulationState();

  const stream = new ReadableStream({
    start(controller) {
      // Register this controller for SSE broadcasts
      state.addSSEController(controller);

      // Send initial state sync
      const syncData = `data: ${JSON.stringify({
        type: "state_sync",
        payload: state.getSnapshot(),
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(syncData));

      // Start the orchestrator if simulation is running
      if (state.status === "running") {
        const orchestrator = new Orchestrator(state);
        orchestrator.startLoop(3000);
      }
    },
    cancel(controller) {
      state.removeSSEController(controller as ReadableStreamDefaultController);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
