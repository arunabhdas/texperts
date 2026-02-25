import Anthropic from "@anthropic-ai/sdk";
import { AgentAction, Emotion } from "@/types";
import { AGENT_ACTION_TOOL } from "./PromptTemplates";

const MODEL = "claude-sonnet-4-20250514";

/**
 * Wrapper around the Anthropic SDK.
 * Supports structured output via tool_use and streaming.
 */
export class ClaudeClient {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY || "",
    });
  }

  /**
   * Get an agent action using structured output (tool_use).
   * Returns the parsed AgentAction.
   */
  async getAgentAction(
    agentId: string,
    tick: number,
    systemPrompt: string,
  ): Promise<AgentAction> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: "It's your turn. Decide what to do next and use the agent_action tool.",
        },
      ],
      tools: [AGENT_ACTION_TOOL],
      tool_choice: { type: "tool", name: "agent_action" },
    });

    // Extract tool use from response
    const toolUse = response.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      // Fallback: wait action
      return {
        agent_id: agentId,
        tick,
        action_type: "wait",
        reasoning: "Could not determine action",
      };
    }

    const input = toolUse.input as Record<string, unknown>;

    return {
      agent_id: agentId,
      tick,
      action_type: (input.action_type as AgentAction["action_type"]) || "wait",
      destination: input.destination as string | undefined,
      target: input.target as string | undefined,
      content: input.content as string | undefined,
      summary: input.summary as string | undefined,
      emotion: input.emotion as Emotion | undefined,
      agreement_score: input.agreement_score as number | undefined,
      confidence: input.confidence as number | undefined,
      reasoning: input.reasoning as string | undefined,
    };
  }

  /**
   * Get an agent action with streaming — yields tokens as they arrive.
   * The final result is the parsed AgentAction.
   */
  async getAgentActionStreaming(
    agentId: string,
    tick: number,
    systemPrompt: string,
    onToken?: (token: string) => void,
  ): Promise<AgentAction> {
    const stream = this.client.messages.stream({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: "It's your turn. Decide what to do next and use the agent_action tool.",
        },
      ],
      tools: [AGENT_ACTION_TOOL],
      tool_choice: { type: "tool", name: "agent_action" },
    });

    // Listen for text events (reasoning text before tool call)
    stream.on("text", (text: string) => {
      if (onToken) onToken(text);
    });

    const finalMessage = await stream.finalMessage();

    // Extract tool use from final message
    const toolUse = finalMessage.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return {
        agent_id: agentId,
        tick,
        action_type: "wait",
        reasoning: "Could not determine action",
      };
    }

    const input = toolUse.input as Record<string, unknown>;

    return {
      agent_id: agentId,
      tick,
      action_type: (input.action_type as AgentAction["action_type"]) || "wait",
      destination: input.destination as string | undefined,
      target: input.target as string | undefined,
      content: input.content as string | undefined,
      summary: input.summary as string | undefined,
      emotion: input.emotion as Emotion | undefined,
      agreement_score: input.agreement_score as number | undefined,
      confidence: input.confidence as number | undefined,
      reasoning: input.reasoning as string | undefined,
    };
  }

  /**
   * Score the importance of a memory (1-10). Fast, non-streaming call.
   */
  async scoreImportance(content: string): Promise<number> {
    try {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: 8,
        messages: [
          {
            role: "user",
            content: `On a scale of 1 to 10, where 1 is completely mundane and 10 is extremely critical, rate the importance of this memory:\n\n"${content}"\n\nRespond with ONLY a single integer from 1 to 10.`,
          },
        ],
      });

      const text = response.content[0];
      if (text.type === "text") {
        const score = parseInt(text.text.trim(), 10);
        if (score >= 1 && score <= 10) return score;
      }
      return 5; // default
    } catch {
      return 5; // fallback on error
    }
  }

  /**
   * Generate reflections from recent observations.
   */
  async generateReflections(prompt: string): Promise<string[]> {
    try {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content[0];
      if (text.type === "text") {
        try {
          return JSON.parse(text.text) as string[];
        } catch {
          // If not valid JSON, split by newlines
          return text.text.split("\n").filter((l) => l.trim().length > 0).slice(0, 3);
        }
      }
      return [];
    } catch {
      return [];
    }
  }
}
