import { AgentAction, ServerMessage } from "@/types";
import { SimulationState } from "./SimulationState";
import { Agent } from "./Agent";
import { CognitiveLoop } from "./CognitiveLoop";
import { ClaudeClient } from "./llm/ClaudeClient";
import { ReflectionEngine } from "./ReflectionEngine";
import { ConversationManager } from "./ConversationManager";

// Mock speeches for demo before Claude integration
const MOCK_ACTIONS: Record<string, AgentAction[]> = {
  visionary: [
    { agent_id: "visionary", tick: 0, action_type: "think", target: "self", content: "Time to rally the team. The consumer market is massive.", summary: "Thinking about the pivot opportunity", emotion: "excited", confidence: 0.9, reasoning: "Reading the briefing" },
    { agent_id: "visionary", tick: 0, action_type: "move_to", destination: "boardroom", reasoning: "Need to gather the team" },
    { agent_id: "visionary", tick: 0, action_type: "speak", target: "all", content: "Team, I've been thinking about this pivot. The consumer TAM is 50 million users. Even at 1% penetration, that's 500K users. This could be transformative.", summary: "Consumer TAM is 50M — this could be huge", emotion: "excited", confidence: 0.85, agreement_score: 0.8 },
  ],
  skeptic: [
    { agent_id: "skeptic", tick: 0, action_type: "think", target: "self", content: "Consumer CAC is astronomical. Need to check the numbers.", summary: "Checking the financial implications", emotion: "skeptical", confidence: 0.8, reasoning: "Numbers don't add up" },
    { agent_id: "skeptic", tick: 0, action_type: "move_to", destination: "boardroom", reasoning: "Need to challenge assumptions" },
    { agent_id: "skeptic", tick: 0, action_type: "speak", target: "visionary", content: "Hold on. Consumer acquisition costs are 5-10x higher than enterprise. Our burn rate would triple. With $5M runway, we'd have maybe 8 months.", summary: "CAC is 5-10x higher. 8 months of runway.", emotion: "skeptical", confidence: 0.9, agreement_score: -0.7 },
  ],
  builder: [
    { agent_id: "builder", tick: 0, action_type: "think", target: "self", content: "Product architecture needs significant rework for consumer UX.", summary: "Assessing technical feasibility", emotion: "neutral", confidence: 0.7, reasoning: "Evaluating engineering capacity" },
    { agent_id: "builder", tick: 0, action_type: "move_to", destination: "boardroom", reasoning: "Sharing technical perspective" },
    { agent_id: "builder", tick: 0, action_type: "speak", target: "all", content: "From a technical standpoint, consumer UX needs a full rebuild. That's 6 months minimum with our team of 12.", summary: "6 months of rework needed for consumer UX", emotion: "uncertain", confidence: 0.75, agreement_score: -0.3 },
  ],
  whisperer: [
    { agent_id: "whisperer", tick: 0, action_type: "think", target: "self", content: "Customer interviews show organic individual adoption. Data supports hybrid approach.", summary: "Reviewing customer interview data", emotion: "confident", confidence: 0.8, reasoning: "200+ interviews tell a story" },
    { agent_id: "whisperer", tick: 0, action_type: "move_to", destination: "boardroom", reasoning: "Sharing customer data" },
    { agent_id: "whisperer", tick: 0, action_type: "speak", target: "all", content: "40% of our B2B users came from individual word-of-mouth. There's already organic consumer pull. We could add a consumer tier without a full pivot.", summary: "40% of users came from organic individual adoption", emotion: "confident", confidence: 0.85, agreement_score: 0.4 },
  ],
  devil: [
    { agent_id: "devil", tick: 0, action_type: "think", target: "self", content: "Everyone will have strong opinions. My job is to find blind spots.", summary: "Preparing to challenge consensus", emotion: "amused", confidence: 0.9, reasoning: "Preventing groupthink" },
    { agent_id: "devil", tick: 0, action_type: "move_to", destination: "boardroom", reasoning: "Where the action is" },
    { agent_id: "devil", tick: 0, action_type: "speak", target: "all", content: "Has anyone asked why our B2B growth is 15% MoM? That's exceptional. Why abandon a winning strategy? What if the consumer opportunity is a mirage?", summary: "Why abandon 15% MoM growth? Is B2C a mirage?", emotion: "skeptical", confidence: 0.85, agreement_score: -0.5 },
  ],
};

/**
 * Orchestrator — manages the simulation tick loop.
 * Supports mock mode (no API key) and real Claude mode.
 */
export class Orchestrator {
  private state: SimulationState;
  private tickInterval: ReturnType<typeof setTimeout> | null = null;
  private mockActionIndex: Map<string, number> = new Map();
  private cognitiveLoop: CognitiveLoop | null = null;
  private reflectionEngine: ReflectionEngine | null = null;
  private conversationManager: ConversationManager;
  private useMock: boolean;

  constructor(state: SimulationState, apiKey?: string) {
    this.state = state;
    this.conversationManager = new ConversationManager();

    // Use real Claude if API key is available
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    this.useMock = !key;

    if (!this.useMock && key) {
      const client = new ClaudeClient(key);
      this.cognitiveLoop = new CognitiveLoop(
        client,
        state.environmentTree,
        state.spatialState,
      );
      this.reflectionEngine = new ReflectionEngine(client);
    }

    for (const agentId of Object.keys(MOCK_ACTIONS)) {
      this.mockActionIndex.set(agentId, 0);
    }
  }

  async runTick(): Promise<ServerMessage[]> {
    this.state.tick++;
    const messages: ServerMessage[] = [];

    const tickMsg: ServerMessage = {
      type: "tick",
      payload: { tick: this.state.tick, simulation_time: `Tick ${this.state.tick}` },
    };
    messages.push(tickMsg);
    this.state.broadcast(tickMsg);

    const agents = this.getAgentsInTurnOrder();

    for (const agent of agents) {
      const action = this.useMock
        ? await this.getMockAction(agent)
        : await this.getRealAction(agent);

      if (!action) continue;

      action.tick = this.state.tick;
      const actionMessages = await this.executeAction(agent, action);
      messages.push(...actionMessages);
      agent.turnsSinceLastAction = 0;

      // Check if reflection should trigger
      if (this.reflectionEngine && this.reflectionEngine.shouldReflect(agent)) {
        try {
          const reflections = await this.reflectionEngine.reflect(agent, this.state.tick);
          for (const reflection of reflections) {
            const reflectionMsg: ServerMessage = {
              type: "agent_action_complete",
              payload: {
                agent_id: agent.id,
                tick: this.state.tick,
                action_type: "think",
                content: reflection,
                summary: reflection,
                emotion: agent.emotion,
                confidence: 0.8,
                reasoning: "Reflection on recent observations",
              },
            };
            messages.push(reflectionMsg);
            this.state.broadcast(reflectionMsg);
          }
        } catch (err) {
          console.error(`Reflection error for ${agent.id}:`, err);
        }
      }

      // Delay between agents
      await sleep(this.useMock ? 100 : 500);
    }

    return messages;
  }

  startLoop(intervalMs = 3000): void {
    if (this.tickInterval) return;
    this.state.status = "running";

    const loop = async () => {
      if (this.state.status !== "running") return;
      await this.runTick();
      this.tickInterval = setTimeout(loop, intervalMs / this.state.speed);
    };

    loop();
  }

  pause(): void {
    this.state.status = "paused";
    if (this.tickInterval) {
      clearTimeout(this.tickInterval);
      this.tickInterval = null;
    }
  }

  resume(intervalMs = 3000): void {
    if (this.state.status === "running") return;
    this.startLoop(intervalMs);
  }

  async step(): Promise<ServerMessage[]> {
    this.state.status = "paused";
    return this.runTick();
  }

  // --- Private ---

  private getAgentsInTurnOrder(): Agent[] {
    const agents = Array.from(this.state.agents.values());
    agents.sort((a, b) => b.turnsSinceLastAction - a.turnsSinceLastAction);
    for (const a of agents) a.turnsSinceLastAction++;
    return agents;
  }

  private async getMockAction(agent: Agent): Promise<AgentAction | null> {
    const actions = MOCK_ACTIONS[agent.id];
    if (!actions) return null;

    const index = this.mockActionIndex.get(agent.id) ?? 0;
    if (index >= actions.length) {
      return { agent_id: agent.id, tick: this.state.tick, action_type: "wait", reasoning: "Listening" };
    }

    this.mockActionIndex.set(agent.id, index + 1);
    return { ...actions[index], tick: this.state.tick };
  }

  private async getRealAction(agent: Agent): Promise<AgentAction | null> {
    if (!this.cognitiveLoop) return this.getMockAction(agent);

    try {
      // Notify client that agent is thinking
      const thinkingMsg: ServerMessage = {
        type: "agent_thinking",
        payload: { agent_id: agent.id },
      };
      this.state.broadcast(thinkingMsg);

      const action = await this.cognitiveLoop.think(
        agent,
        this.state.agents,
        (token) => {
          // Stream tokens for speech content
          this.state.broadcast({
            type: "agent_stream_token",
            payload: { agent_id: agent.id, token, bubble_type: "speech" },
          });
        },
      );

      return action;
    } catch (error) {
      console.error(`Error getting action for ${agent.id}:`, error);
      return this.getMockAction(agent);
    }
  }

  private async executeAction(agent: Agent, action: AgentAction): Promise<ServerMessage[]> {
    const messages: ServerMessage[] = [];
    agent.lastAction = action;

    switch (action.action_type) {
      case "move_to": {
        if (!action.destination) break;
        const targetTile = this.state.zoneRegistry.getSpawnTile(action.destination);
        if (!targetTile) break;

        // Remove from old zone conversation
        if (agent.currentZone) {
          this.conversationManager.removeParticipant(agent.currentZone, agent.id);
        }

        agent.status = "moving";
        const moveMsg: ServerMessage = {
          type: "agent_move",
          payload: { agent_id: agent.id, path: [{ x: targetTile.x, y: targetTile.y }], speed: 200 },
        };
        messages.push(moveMsg);
        this.state.broadcast(moveMsg);

        agent.tileX = targetTile.x;
        agent.tileY = targetTile.y;
        agent.currentZone = action.destination;
        this.state.spatialState.setPosition(agent.id, targetTile.x, targetTile.y);
        agent.status = "idle";

        // Add to new zone conversation
        this.conversationManager.addParticipant(action.destination, agent.id, this.state.tick);

        this.state.eventLog.add({
          tick: this.state.tick,
          type: "movement",
          agentId: agent.id,
          agentName: agent.name,
          content: `${agent.name} moved to ${action.destination}`,
        });

        // Deliver perception to agents already in that zone
        const agentsInZone = this.state.spatialState.getAgentsInSameZone(agent.id);
        for (const nearbyId of agentsInZone) {
          const nearby = this.state.agents.get(nearbyId);
          if (nearby) {
            nearby.addObservation(
              this.state.tick,
              `${agent.name} (${agent.role}) arrived at ${action.destination}`,
              3,
              action.destination,
              agent.id,
            );
            if (this.cognitiveLoop) {
              this.cognitiveLoop.addPerception(
                nearbyId,
                `${agent.name} (${agent.role}) just arrived at ${action.destination}.`,
              );
            }
          }
        }
        break;
      }

      case "speak": {
        agent.status = "speaking";
        if (action.emotion) agent.emotion = action.emotion;

        const speakMsg: ServerMessage = {
          type: "agent_action_complete",
          payload: action,
        };
        messages.push(speakMsg);
        this.state.broadcast(speakMsg);

        this.state.eventLog.add({
          tick: this.state.tick,
          type: "speech",
          agentId: agent.id,
          agentName: agent.name,
          content: action.summary || action.content || "",
          target: action.target,
        });

        // Deliver as perception to nearby agents
        const nearbyAgents = this.state.spatialState.getAgentsInSameZone(agent.id);
        for (const nearbyId of nearbyAgents) {
          const nearby = this.state.agents.get(nearbyId);
          if (nearby) {
            nearby.addObservation(
              this.state.tick,
              `${agent.name} said: "${action.content}"`,
              6,
              agent.currentZone ?? undefined,
              agent.id,
            );
            if (this.cognitiveLoop) {
              this.cognitiveLoop.addPerception(
                nearbyId,
                `${agent.name} said: "${action.content}"`,
              );
            }
          }
        }

        // Add to conversation history
        if (agent.currentZone) {
          this.conversationManager.addTurn(
            agent.currentZone,
            agent.id,
            agent.name,
            action.content || "",
            this.state.tick,
          );
          if (this.cognitiveLoop) {
            this.cognitiveLoop.addConversationTurn(
              agent.currentZone,
              `${agent.name}: ${action.content}`,
            );
          }
        }

        agent.status = "idle";
        break;
      }

      case "think": {
        agent.status = "thinking";
        if (action.emotion) agent.emotion = action.emotion;

        const thinkMsg: ServerMessage = {
          type: "agent_action_complete",
          payload: action,
        };
        messages.push(thinkMsg);
        this.state.broadcast(thinkMsg);

        agent.addObservation(this.state.tick, `I thought: ${action.content}`, 4);

        this.state.eventLog.add({
          tick: this.state.tick,
          type: "thought",
          agentId: agent.id,
          agentName: agent.name,
          content: action.summary || action.content || "",
        });

        agent.status = "idle";
        break;
      }

      case "wait": {
        agent.status = "idle";
        break;
      }
    }

    return messages;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
