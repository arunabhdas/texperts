import { AgentConfig, SimulationSnapshot, ServerMessage } from "@/types";
import { Agent } from "./Agent";
import { EventLog } from "./EventLog";
import { EnvironmentTree } from "./world/EnvironmentTree";
import { ZoneRegistry } from "./world/ZoneRegistry";
import { SpatialState } from "./world/SpatialState";

// Default scenario agents
export const DEFAULT_AGENT_CONFIGS: AgentConfig[] = [
  {
    id: "visionary",
    name: "The Visionary",
    role: "CEO",
    color: "#4CAF50",
    disposition: "collaborative",
    startingLocation: "office_visionary",
    persona: "You are The Visionary, a startup CEO who thinks in terms of market opportunity and bold moves. You're excited about the B2C pivot because you see a massive TAM of 50M consumers. You tend to inspire others but sometimes overlook execution details. You believe in moving fast and iterating.",
  },
  {
    id: "skeptic",
    name: "The Skeptic",
    role: "CFO",
    color: "#F44336",
    disposition: "adversarial",
    startingLocation: "office_skeptic",
    persona: "You are The Skeptic, a cautious CFO who demands evidence before any major decision. You're concerned about the B2C pivot because consumer acquisition costs are 5-10x higher than enterprise, the burn rate would triple, and the company has zero consumer brand recognition. You challenge assumptions relentlessly but fairly. You respect data above all.",
  },
  {
    id: "builder",
    name: "The Builder",
    role: "CTO",
    color: "#2196F3",
    disposition: "neutral",
    startingLocation: "office_builder",
    persona: "You are The Builder, a pragmatic CTO who thinks about what's technically feasible and what the team of 12 engineers can actually ship in 6 months. You have concerns about rebuilding the product for consumer UX, but you also see technical advantages in the pivot. You're honest about timelines.",
  },
  {
    id: "whisperer",
    name: "The Customer Whisperer",
    role: "Head of Product",
    color: "#FFEB3B",
    disposition: "collaborative",
    startingLocation: "office_whisperer",
    persona: "You are The Customer Whisperer, head of product who deeply understands user needs through 200+ customer interviews. You have data showing that 40% of B2B users actually came through word-of-mouth from individual users who loved the product. This makes you believe a B2C play has organic potential. You think about product-market fit above all.",
  },
  {
    id: "devil",
    name: "Devil's Advocate",
    role: "Board Advisor",
    color: "#9C27B0",
    disposition: "adversarial",
    startingLocation: "office_devil",
    persona: "You are the Devil's Advocate, a board advisor whose explicit role is to challenge every argument, find weaknesses, and prevent groupthink. You don't have a personal position on the pivot — your job is to stress-test whatever the current consensus is. If everyone agrees, you disagree. If everyone disagrees, you find the case for agreement. You ask uncomfortable questions.",
  },
];

const DEFAULT_BRIEFING = `The board has asked the leadership team to evaluate whether the company should pivot from its current B2B SaaS model to a B2C consumer product. The B2B business is generating $2M ARR with 15% month-over-month growth, but the team believes the consumer market opportunity is 100x larger. The company has $5M in runway. The board wants a recommendation by end of week. Each team member should evaluate this from their area of expertise and discuss.`;

/**
 * Canonical simulation state. Singleton instance managed by the module.
 */
export class SimulationState {
  tick = 0;
  status: "running" | "paused" | "stopped" = "stopped";
  speed = 1;
  agents: Map<string, Agent> = new Map();
  eventLog: EventLog;
  environmentTree: EnvironmentTree;
  zoneRegistry: ZoneRegistry;
  spatialState: SpatialState;
  briefing: string;

  // SSE subscribers — each is a writable controller
  private sseControllers: Set<ReadableStreamDefaultController> = new Set();

  constructor() {
    this.eventLog = new EventLog();
    this.environmentTree = new EnvironmentTree();
    this.zoneRegistry = new ZoneRegistry();
    this.spatialState = new SpatialState(this.zoneRegistry);
    this.briefing = DEFAULT_BRIEFING;
  }

  initialize(agentConfigs: AgentConfig[] = DEFAULT_AGENT_CONFIGS): void {
    this.tick = 0;
    this.status = "paused";
    this.agents.clear();

    for (const cfg of agentConfigs) {
      const spawnTile = this.zoneRegistry.getSpawnTile(cfg.startingLocation);
      if (!spawnTile) continue;

      const agent = new Agent(cfg, spawnTile.x, spawnTile.y);
      this.agents.set(cfg.id, agent);
      this.spatialState.setPosition(cfg.id, spawnTile.x, spawnTile.y);

      // Initial observation: scenario briefing
      agent.addObservation(0, `Scenario briefing: ${this.briefing}`, 9, cfg.startingLocation);
    }

    this.eventLog.add({
      tick: 0,
      type: "system",
      content: "Simulation initialized. Agents reading scenario briefing.",
    });
  }

  getSnapshot(): SimulationSnapshot {
    return {
      tick: this.tick,
      simulationTime: `Tick ${this.tick}`,
      status: this.status,
      agents: Array.from(this.agents.values()).map((a) => a.getState()),
      events: this.eventLog.getRecent(20),
    };
  }

  // --- SSE Management ---

  addSSEController(controller: ReadableStreamDefaultController): void {
    this.sseControllers.add(controller);
  }

  removeSSEController(controller: ReadableStreamDefaultController): void {
    this.sseControllers.delete(controller);
  }

  /** Broadcast a message to all connected SSE clients. */
  broadcast(message: ServerMessage): void {
    const data = `data: ${JSON.stringify(message)}\n\n`;
    const deadControllers: ReadableStreamDefaultController[] = [];

    for (const controller of Array.from(this.sseControllers)) {
      try {
        controller.enqueue(new TextEncoder().encode(data));
      } catch {
        deadControllers.push(controller);
      }
    }

    for (const c of deadControllers) {
      this.sseControllers.delete(c);
    }
  }
}

// --- Module-level singleton ---
let instance: SimulationState | null = null;

export function getSimulationState(): SimulationState {
  if (!instance) {
    instance = new SimulationState();
  }
  return instance;
}
