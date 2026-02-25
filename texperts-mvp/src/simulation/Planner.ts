import { AgentAction } from "@/types";
import { Agent } from "./Agent";
import { ClaudeClient } from "./llm/ClaudeClient";

/**
 * Plan generation and decomposition.
 * Full implementation in Milestone 6.
 */
export class Planner {
  private client: ClaudeClient;

  constructor(client: ClaudeClient) {
    this.client = client;
  }

  /**
   * Decompose a high-level plan into sub-actions.
   * E.g., "Go to Boardroom and challenge the Visionary" →
   *   1. move_to("boardroom")
   *   2. speak(target="visionary", ...)
   */
  async decompose(_agent: Agent, _plan: string): Promise<AgentAction[]> {
    // Stub — will be implemented in Milestone 6
    return [];
  }

  /**
   * Re-evaluate whether the current plan should change based on new perceptions.
   */
  async shouldReplan(_agent: Agent, _newPerceptions: string[]): Promise<boolean> {
    // Stub — will be implemented in Milestone 6
    return false;
  }
}
