import { Agent } from "./Agent";
import { ClaudeClient } from "./llm/ClaudeClient";
import { buildReflectionPrompt } from "./llm/PromptTemplates";

const REFLECTION_THRESHOLD = 15;

/**
 * Generates periodic higher-level reflections when importance threshold is exceeded.
 * Full implementation in Milestone 6.
 */
export class ReflectionEngine {
  private client: ClaudeClient;

  constructor(client: ClaudeClient) {
    this.client = client;
  }

  /** Check if reflection should be triggered for this agent. */
  shouldReflect(agent: Agent): boolean {
    return agent.memory.getUnreflectedImportanceSum() >= REFLECTION_THRESHOLD;
  }

  /** Generate reflections for an agent. */
  async reflect(agent: Agent, tick: number): Promise<string[]> {
    const recentObs = agent.memory
      .getRecent("observation", 10)
      .map((m) => m.content);

    if (recentObs.length === 0) return [];

    const prompt = buildReflectionPrompt(agent.name, agent.role, recentObs);
    const reflections = await this.client.generateReflections(prompt);

    // Add reflections to memory
    for (const reflection of reflections) {
      agent.addReflection(tick, reflection);
    }

    return reflections;
  }
}
