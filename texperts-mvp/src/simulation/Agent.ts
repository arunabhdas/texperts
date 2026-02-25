import { AgentConfig, AgentState, AgentAction, Emotion } from "@/types";
import { MemoryStream } from "./MemoryStream";

/**
 * Server-side Agent — holds state, persona, memory, and plan.
 */
export class Agent {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly color: string;
  readonly disposition: string;
  readonly persona: string;
  readonly startingLocation: string;

  tileX: number;
  tileY: number;
  currentZone: string | null;
  currentPlan: string | null = null;
  status: AgentState["status"] = "idle";
  emotion: Emotion = "neutral";
  memory: MemoryStream;
  lastAction: AgentAction | null = null;
  turnsSinceLastAction = 0;

  constructor(config: AgentConfig, startTileX: number, startTileY: number) {
    this.id = config.id;
    this.name = config.name;
    this.role = config.role;
    this.color = config.color;
    this.disposition = config.disposition;
    this.persona = config.persona;
    this.startingLocation = config.startingLocation;
    this.tileX = startTileX;
    this.tileY = startTileY;
    this.currentZone = config.startingLocation;
    this.memory = new MemoryStream();
  }

  getState(): AgentState {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      color: this.color,
      tileX: this.tileX,
      tileY: this.tileY,
      currentZone: this.currentZone,
      currentPlan: this.currentPlan,
      status: this.status,
      emotion: this.emotion,
    };
  }

  addObservation(tick: number, content: string, importance = 5, location?: string, associatedAgent?: string): void {
    const keywords = content.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    this.memory.add({
      tick,
      timestamp: new Date().toISOString(),
      type: "observation",
      content,
      importance,
      embedding_keywords: keywords.slice(0, 10),
      associated_agent: associatedAgent,
      location,
    });
  }

  addReflection(tick: number, content: string, importance = 7): void {
    const keywords = content.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    this.memory.add({
      tick,
      timestamp: new Date().toISOString(),
      type: "reflection",
      content,
      importance,
      embedding_keywords: keywords.slice(0, 10),
    });
  }
}
