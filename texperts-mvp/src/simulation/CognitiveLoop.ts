import { AgentAction } from "@/types";
import { Agent } from "./Agent";
import { ClaudeClient } from "./llm/ClaudeClient";
import { buildSystemPrompt } from "./llm/PromptTemplates";
import { EnvironmentTree } from "./world/EnvironmentTree";
import { SpatialState } from "./world/SpatialState";

/**
 * Cognitive loop: perceive → plan → act.
 * Drives a single agent's decision-making per tick.
 */
export class CognitiveLoop {
  private client: ClaudeClient;
  private envTree: EnvironmentTree;
  private spatialState: SpatialState;

  // Track new perceptions per agent since last turn
  private pendingPerceptions: Map<string, string[]> = new Map();

  // Track conversation history per zone
  private conversationHistory: Map<string, string[]> = new Map();

  constructor(
    client: ClaudeClient,
    envTree: EnvironmentTree,
    spatialState: SpatialState,
  ) {
    this.client = client;
    this.envTree = envTree;
    this.spatialState = spatialState;
  }

  /** Add a perception for an agent (to be delivered on their next turn). */
  addPerception(agentId: string, perception: string): void {
    if (!this.pendingPerceptions.has(agentId)) {
      this.pendingPerceptions.set(agentId, []);
    }
    this.pendingPerceptions.get(agentId)!.push(perception);
  }

  /** Record a conversation turn in a zone. */
  addConversationTurn(zoneId: string, turn: string): void {
    if (!this.conversationHistory.has(zoneId)) {
      this.conversationHistory.set(zoneId, []);
    }
    const history = this.conversationHistory.get(zoneId)!;
    history.push(turn);
    // Keep last 20 turns
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
  }

  /**
   * Run one cognitive cycle for an agent. Returns their chosen action.
   */
  async think(
    agent: Agent,
    agents: Map<string, Agent>,
    onToken?: (token: string) => void,
  ): Promise<AgentAction> {
    // 1. Gather nearby agents
    const nearbyIds = this.spatialState.getAgentsInSameZone(agent.id);
    const nearbyNames = nearbyIds
      .map((id) => {
        const a = agents.get(id);
        return a ? `${a.name} (${a.role})` : id;
      });

    // 2. Get conversation history for current zone
    const zoneId = agent.currentZone || "";
    const conversation = this.conversationHistory.get(zoneId) || [];

    // 3. Get pending perceptions
    const perceptions = this.pendingPerceptions.get(agent.id) || [];
    this.pendingPerceptions.set(agent.id, []); // clear after delivery

    // 4. Build system prompt
    const systemPrompt = buildSystemPrompt(
      agent,
      this.envTree,
      nearbyNames,
      conversation,
      perceptions,
    );

    // 5. Call Claude for action
    try {
      const action = await this.client.getAgentActionStreaming(
        agent.id,
        0, // tick will be set by orchestrator
        systemPrompt,
        onToken,
      );

      // Update agent state
      if (action.emotion) agent.emotion = action.emotion;
      agent.currentPlan = action.reasoning || null;

      return action;
    } catch (error) {
      console.error(`Claude error for agent ${agent.id}:`, error);
      // Fallback to a wait action
      return {
        agent_id: agent.id,
        tick: 0,
        action_type: "wait",
        reasoning: "Thinking...",
      };
    }
  }
}
