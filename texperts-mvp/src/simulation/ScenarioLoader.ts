import { AgentConfig, SimulationConfig } from "@/types";
import { DEFAULT_AGENT_CONFIGS } from "./SimulationState";

const B2B_B2C_BRIEFING = `The board has asked the leadership team to evaluate whether the company should pivot from its current B2B SaaS model to a B2C consumer product. The B2B business is generating $2M ARR with 15% month-over-month growth, but the team believes the consumer market opportunity is 100x larger. The company has $5M in runway. The board wants a recommendation by end of week. Each team member should evaluate this from their area of expertise and discuss.`;

export interface ScenarioDefinition {
  id: string;
  name: string;
  briefing: string;
  agents: AgentConfig[];
}

const SCENARIOS: ScenarioDefinition[] = [
  {
    id: "b2b-b2c-pivot",
    name: "Should our startup pivot from B2B to B2C?",
    briefing: B2B_B2C_BRIEFING,
    agents: DEFAULT_AGENT_CONFIGS,
  },
];

export function getScenarios(): ScenarioDefinition[] {
  return SCENARIOS;
}

export function getScenario(id: string): ScenarioDefinition | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

export function getDefaultScenarioConfig(): SimulationConfig {
  const scenario = SCENARIOS[0];
  return {
    scenario: scenario.name,
    briefing: scenario.briefing,
    agents: scenario.agents,
    tickIntervalMs: 3000,
    speed: 1,
  };
}
