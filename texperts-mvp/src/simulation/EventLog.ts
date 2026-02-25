import { SimulationEvent } from "@/types";

let eventCounter = 0;

/**
 * Append-only event log for the entire simulation.
 */
export class EventLog {
  private events: SimulationEvent[] = [];

  add(event: Omit<SimulationEvent, "id" | "timestamp">): SimulationEvent {
    const full: SimulationEvent = {
      ...event,
      id: `evt_${++eventCounter}`,
      timestamp: new Date().toISOString(),
    };
    this.events.push(full);
    return full;
  }

  getAll(): SimulationEvent[] {
    return this.events;
  }

  getRecent(limit = 50): SimulationEvent[] {
    return this.events.slice(-limit);
  }

  getByAgent(agentId: string): SimulationEvent[] {
    return this.events.filter((e) => e.agentId === agentId);
  }

  getByType(type: SimulationEvent["type"]): SimulationEvent[] {
    return this.events.filter((e) => e.type === type);
  }

  get length(): number {
    return this.events.length;
  }
}
