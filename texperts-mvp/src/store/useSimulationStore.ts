import { create } from "zustand";
import { AgentState, SimulationEvent, SimulationSnapshot, ServerMessage, AgentAction } from "@/types";

const API_KEY_STORAGE = "texperts_api_key";

function getApiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined") {
    const key = localStorage.getItem(API_KEY_STORAGE);
    if (key) headers["x-api-key"] = key;
  }
  return headers;
}

interface SimulationStore {
  // State
  tick: number;
  status: "running" | "paused" | "stopped";
  agents: AgentState[];
  events: SimulationEvent[];
  selectedAgentId: string | null;
  speed: number;
  isConnected: boolean;

  // Actions
  setStatus: (status: SimulationStore["status"]) => void;
  setSelectedAgent: (id: string | null) => void;
  setSpeed: (speed: number) => void;
  setConnected: (connected: boolean) => void;
  applySnapshot: (snapshot: SimulationSnapshot) => void;
  addEvent: (event: SimulationEvent) => void;
  handleServerMessage: (message: ServerMessage) => void;

  // API calls
  startSimulation: () => Promise<void>;
  pauseSimulation: () => Promise<void>;
  resumeSimulation: () => Promise<void>;
  stepSimulation: () => Promise<void>;
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  tick: 0,
  status: "stopped",
  agents: [],
  events: [],
  selectedAgentId: null,
  speed: 1,
  isConnected: false,

  setStatus: (status) => set({ status }),
  setSelectedAgent: (id) => set({ selectedAgentId: id }),
  setSpeed: (speed) => set({ speed }),
  setConnected: (connected) => set({ isConnected: connected }),

  applySnapshot: (snapshot) =>
    set({
      tick: snapshot.tick,
      status: snapshot.status,
      agents: snapshot.agents,
      events: snapshot.events,
    }),

  addEvent: (event) =>
    set((state) => ({
      events: [...state.events.slice(-99), event],
    })),

  handleServerMessage: (message: ServerMessage) => {
    const state = get();

    switch (message.type) {
      case "state_sync":
        state.applySnapshot(message.payload);
        break;

      case "tick":
        set({ tick: message.payload.tick });
        break;

      case "agent_move": {
        // Update agent position in store (final position from path)
        const path = message.payload.path;
        if (path.length > 0) {
          const lastTile = path[path.length - 1];
          set((s) => ({
            agents: s.agents.map((a) =>
              a.id === message.payload.agent_id
                ? { ...a, tileX: lastTile.x, tileY: lastTile.y, status: "moving" as const }
                : a,
            ),
          }));
        }
        break;
      }

      case "agent_action_complete": {
        const action = message.payload as AgentAction;
        // Update agent status/emotion
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === action.agent_id
              ? { ...a, status: "idle" as const, emotion: action.emotion ?? a.emotion }
              : a,
          ),
        }));

        // Add to event log
        if (action.action_type === "speak" || action.action_type === "think") {
          state.addEvent({
            id: `evt_${Date.now()}`,
            tick: action.tick,
            timestamp: new Date().toISOString(),
            type: action.action_type === "speak" ? "speech" : "thought",
            agentId: action.agent_id,
            content: action.summary || action.content || "",
            target: action.target,
          });
        }
        break;
      }

      case "agent_thinking":
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === message.payload.agent_id ? { ...a, status: "thinking" as const } : a,
          ),
        }));
        break;
    }
  },

  startSimulation: async () => {
    const res = await fetch("/api/simulation/start", {
      method: "POST",
      headers: getApiHeaders(),
    });
    const data = await res.json();
    if (data.success) {
      get().applySnapshot(data.snapshot);
    }
  },

  pauseSimulation: async () => {
    await fetch("/api/simulation/pause", {
      method: "POST",
      headers: getApiHeaders(),
    });
    set({ status: "paused" });
  },

  resumeSimulation: async () => {
    await fetch("/api/simulation/resume", {
      method: "POST",
      headers: getApiHeaders(),
    });
    set({ status: "running" });
  },

  stepSimulation: async () => {
    const res = await fetch("/api/simulation/step", {
      method: "POST",
      headers: getApiHeaders(),
    });
    const data = await res.json();
    if (data.success && data.snapshot) {
      get().applySnapshot(data.snapshot);
    }
  },
}));
