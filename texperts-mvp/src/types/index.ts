// ============================================================
// texperts.ai — Shared Types
// ============================================================

// --- Map & World ---

export enum TileType {
  Floor = 0,
  Wall = 1,
  Furniture = 2,
  Door = 3,
}

export interface ZoneDefinition {
  id: string;
  name: string;
  description: string;
  color: string;           // hex color for overlay
  bounds: { x: number; y: number; width: number; height: number }; // tile coords
  objects: string[];        // objects in this zone (from environment tree)
  spawnTile: { x: number; y: number }; // default tile for agents entering this zone
}

export interface MapData {
  width: number;
  height: number;
  tileSize: number;
  ground: number[][];       // 2D grid of ground tile indices
  obstacles: number[][];    // 2D grid of obstacle tile indices (0 = none)
  walkable: boolean[][];    // true = walkable
  zones: ZoneDefinition[];
}

// --- Agents ---

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  color: string;            // hex color
  disposition: "collaborative" | "adversarial" | "neutral";
  startingLocation: string; // zone id
  persona: string;          // detailed persona seed
}

export type Emotion =
  | "confident"
  | "uncertain"
  | "skeptical"
  | "excited"
  | "alarmed"
  | "neutral"
  | "amused";

export type ActionType = "move_to" | "speak" | "think" | "react" | "wait";

export interface AgentAction {
  agent_id: string;
  tick: number;
  action_type: ActionType;
  destination?: string;
  target?: string;          // agent_id, "all", or "self"
  content?: string;
  summary?: string;         // <= 80 chars for bubble display
  emotion?: Emotion;
  agreement_score?: number; // -1.0 to 1.0
  confidence?: number;      // 0.0 to 1.0
  reasoning?: string;
}

export interface AgentState {
  id: string;
  name: string;
  role: string;
  color: string;
  tileX: number;
  tileY: number;
  currentZone: string | null;
  currentPlan: string | null;
  status: "idle" | "moving" | "speaking" | "thinking" | "planning";
  emotion: Emotion;
}

// --- Memory ---

export interface MemoryEntry {
  id: string;
  tick: number;
  timestamp: string;
  type: "observation" | "reflection" | "plan";
  content: string;
  importance: number;       // 1-10
  embedding_keywords: string[];
  associated_agent?: string;
  location?: string;
  last_accessed: number;
}

// --- Simulation ---

export interface SimulationConfig {
  scenario: string;
  briefing: string;
  agents: AgentConfig[];
  tickIntervalMs: number;   // ms between ticks
  speed: number;            // multiplier (0.5, 1, 2, 4)
}

export interface SimulationSnapshot {
  tick: number;
  simulationTime: string;
  status: "running" | "paused" | "stopped";
  agents: AgentState[];
  events: SimulationEvent[];
}

export interface SimulationEvent {
  id: string;
  tick: number;
  timestamp: string;
  type: "speech" | "thought" | "movement" | "reflection" | "system" | "injection";
  agentId?: string;
  agentName?: string;
  content: string;
  target?: string;
  metadata?: Record<string, unknown>;
}

// --- SSE Protocol (replaces WebSocket) ---

export type ServerMessage =
  | { type: "agent_move"; payload: { agent_id: string; path: Array<{ x: number; y: number }>; speed: number } }
  | { type: "agent_thinking"; payload: { agent_id: string } }
  | { type: "agent_stream_token"; payload: { agent_id: string; token: string; bubble_type: "speech" | "thought" } }
  | { type: "agent_action_complete"; payload: AgentAction }
  | { type: "perception"; payload: { agent_id: string; content: string; source: string } }
  | { type: "reflection"; payload: { agent_id: string; reflections: string[] } }
  | { type: "phase_change"; payload: { phase: string; description: string } }
  | { type: "state_sync"; payload: SimulationSnapshot }
  | { type: "tick"; payload: { tick: number; simulation_time: string } }
  | { type: "error"; payload: { message: string } };

export type ClientAction =
  | { type: "control"; payload: { action: "play" | "pause" | "step" | "reset" } }
  | { type: "set_speed"; payload: { speed: number } }
  | { type: "inject_prompt"; payload: { text: string; target?: string; as_inner_voice?: boolean } }
  | { type: "nudge_agent"; payload: { agent_id: string; destination: string } };
