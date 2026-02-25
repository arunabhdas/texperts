"use client";

import { useEffect, useRef } from "react";
import { useSimulationStore } from "@/store/useSimulationStore";

const TYPE_COLORS: Record<string, string> = {
  speech: "text-[#9ED8A0]",
  thought: "text-[#9EC8E8]",
  movement: "text-[#F0DDA0]",
  reflection: "text-[#C8A0D8]",
  system: "text-[#7a7068]",
  injection: "text-[#c4956a]",
};

const TYPE_ICONS: Record<string, string> = {
  speech: "[say]",
  thought: "[think]",
  movement: "[move]",
  reflection: "[reflect]",
  system: "[sys]",
  injection: "[inject]",
};

export default function EventLog() {
  const events = useSimulationStore((s) => s.events);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className="h-full flex flex-col">
      <div className="text-xs text-[#a89e8c] mb-1 uppercase tracking-wider">
        Event Log
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-0.5">
        {events.length === 0 && (
          <p className="text-xs text-[#7a7068]">Events will appear here...</p>
        )}
        {events.map((event) => (
          <div key={event.id} className="text-xs flex gap-1.5 leading-tight">
            <span className="text-[#7a7068] shrink-0 w-7 text-right">
              t{event.tick}
            </span>
            <span className={`shrink-0 w-14 ${TYPE_COLORS[event.type] || "text-[#a89e8c]"}`}>
              {TYPE_ICONS[event.type] || `[${event.type}]`}
            </span>
            {event.agentName && (
              <span className="text-[#a89e8c] shrink-0">{event.agentName}:</span>
            )}
            <span className="text-[#e8dfd0] break-words">{event.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
