import { Agent } from "../Agent";
import { EnvironmentTree } from "../world/EnvironmentTree";

/**
 * Prompt templates for the cognitive architecture.
 */

export function buildSystemPrompt(
  agent: Agent,
  envTree: EnvironmentTree,
  nearbyAgents: string[],
  conversationHistory: string[],
  newPerceptions: string[],
): string {
  const topMemories = agent.memory.retrieve(0, "pivot B2B B2C discussion", 10);
  const recentReflections = agent.memory.getRecent("reflection", 3);

  return `You are ${agent.name}, ${agent.role} at a startup.

## Your Persona
${agent.persona}

## Your Cognitive State
Current plan: ${agent.currentPlan || "None yet — decide what to do."}
Key memories (most relevant to current context):
${topMemories.length > 0 ? topMemories.map((m, i) => `${i + 1}. [${m.type}] ${m.content}`).join("\n") : "No memories yet."}

Recent reflections:
${recentReflections.length > 0 ? recentReflections.map((r) => `- ${r.content}`).join("\n") : "None yet."}

## The World
${envTree.toNaturalLanguage()}
You are currently at: ${agent.currentZone || "unknown"}
Nearby agents: ${nearbyAgents.length > 0 ? nearbyAgents.join(", ") : "none"}

## Current Conversation
${conversationHistory.length > 0 ? conversationHistory.slice(-5).join("\n") : "No active conversation."}

## What Just Happened
${newPerceptions.length > 0 ? newPerceptions.join("\n") : "Nothing new since your last turn."}

## Instructions
Decide your next action. Use the \`agent_action\` tool to respond. Your options:
- move_to(destination): Walk to a location. Pick from the available locations list.
- speak(target, message): Say something. Target a specific agent or "all".
- think(reflection): Think to yourself. This is private — no one else sees it.
- react(target, emoji): Quick emotional reaction.
- wait(): Do nothing this turn. Observe.

Guidelines:
- Stay in character as ${agent.name} at all times.
- Be concise: speeches should be 1-3 sentences. Thoughts should be 1 sentence.
- Take specific positions with concrete details (numbers, examples).
- Reference things other agents have said when responding.
- Your summary field should be ≤80 characters — a punchy one-liner version of your content.
- If you're moving to a location, briefly explain why in your reasoning field.
- Prefer speaking over waiting if there's an active discussion.`;
}

export const IMPORTANCE_SCORING_PROMPT = `On a scale of 1 to 10, where 1 is completely mundane (e.g., "The Visionary walked to the break room") and 10 is extremely critical (e.g., "The Skeptic revealed the company only has 3 months of runway, not 5"), rate the importance of this memory:

"{content}"

Respond with ONLY a single integer from 1 to 10.`;

export function buildReflectionPrompt(agentName: string, agentRole: string, observations: string[]): string {
  return `You are ${agentName}. Here are your most recent observations:
${observations.map((o, i) => `${i + 1}. ${o}`).join("\n")}

Based on these observations, generate exactly 3 high-level insights or questions. These should be:
- Synthetic (combine multiple observations into a higher-level understanding)
- Relevant to the B2B-to-B2C pivot discussion
- Grounded in your role as ${agentRole}

Format each as a single sentence. Respond with a JSON array of 3 strings.`;
}

/** Claude tool definition for structured AgentAction output. */
export const AGENT_ACTION_TOOL = {
  name: "agent_action",
  description: "Execute your next action in the simulation. Choose one action type and fill in the relevant fields.",
  input_schema: {
    type: "object" as const,
    properties: {
      action_type: {
        type: "string",
        enum: ["move_to", "speak", "think", "react", "wait"],
        description: "The type of action to take",
      },
      destination: {
        type: "string",
        description: "For move_to: the location name to walk to (e.g., 'boardroom', 'library', 'office_visionary')",
      },
      target: {
        type: "string",
        description: "For speak/react: agent name, 'all', or 'self' (for think)",
      },
      content: {
        type: "string",
        description: "For speak/think/react: the full text content",
      },
      summary: {
        type: "string",
        description: "A punchy ≤80 character summary for the speech bubble display",
      },
      emotion: {
        type: "string",
        enum: ["confident", "uncertain", "skeptical", "excited", "alarmed", "neutral", "amused"],
        description: "The emotional tone of this action",
      },
      agreement_score: {
        type: "number",
        description: "For speak: -1.0 (strongly disagree) to 1.0 (strongly agree) with the prior speaker",
      },
      confidence: {
        type: "number",
        description: "0.0 to 1.0 confidence in your statement",
      },
      reasoning: {
        type: "string",
        description: "Brief internal reasoning for this action (shown in thought bubble or inspector)",
      },
    },
    required: ["action_type", "reasoning"],
  },
};
