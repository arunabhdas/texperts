"use client";

import { useEffect } from "react";
import { useSimulationStore } from "@/store/useSimulationStore";
import { getSSEService } from "@/services/SSEService";
import { EventBus } from "@/game/EventBus";
import { ServerMessage, AgentAction } from "@/types";

/**
 * Invisible component that bridges SSE → Zustand → EventBus → Phaser.
 * Mounted once at the app level.
 */
export default function SimulationController() {
  const handleServerMessage = useSimulationStore((s) => s.handleServerMessage);

  useEffect(() => {
    const sse = getSSEService();

    const unsub = sse.onMessage((message: ServerMessage) => {
      // Update Zustand store
      handleServerMessage(message);

      // Forward to Phaser via EventBus
      switch (message.type) {
        case "agent_move":
          EventBus.emit(
            "command-agent-path",
            message.payload.agent_id,
            message.payload.path,
          );
          break;

        case "agent_action_complete": {
          const action = message.payload as AgentAction;
          if (action.action_type === "speak") {
            EventBus.emit(
              "command-show-bubble",
              action.agent_id,
              "speech",
              action.summary || action.content || "",
            );
            // Show connection line to target agent
            if (action.target && action.target !== "all" && action.target !== "self") {
              EventBus.emit(
                "command-show-connection",
                action.agent_id,
                action.target,
                action.agreement_score ?? 0,
              );
            }
            // Show emote based on emotion
            if (action.emotion) {
              const emoteMap: Record<string, string> = {
                excited: "🔥",
                skeptical: "❓",
                confident: "💪",
                alarmed: "⚠️",
                amused: "😄",
                uncertain: "🤷",
              };
              const emote = emoteMap[action.emotion];
              if (emote) {
                EventBus.emit("command-show-emote", action.agent_id, emote);
              }
            }
          } else if (action.action_type === "think") {
            EventBus.emit(
              "command-show-bubble",
              action.agent_id,
              "thought",
              action.summary || action.content || "",
            );
          }
          // Update agent emotion indicator
          if (action.emotion) {
            EventBus.emit("command-set-emotion", action.agent_id, action.emotion);
          }
          break;
        }

        case "agent_thinking":
          // Could show a thinking indicator
          break;

        case "agent_stream_token":
          EventBus.emit(
            "command-stream-token",
            message.payload.agent_id,
            message.payload.token,
          );
          break;
      }
    });

    // Connect SSE
    sse.connect();

    return () => {
      unsub();
      sse.disconnect();
    };
  }, [handleServerMessage]);

  return null; // Invisible bridge component
}
