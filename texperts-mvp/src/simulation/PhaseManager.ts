/**
 * Optional structured phase progression for the simulation.
 * Phases: Setup → Gather → Open Discussion → Breakout → Reconvene → Decision
 */

export type SimulationPhase =
  | "setup"
  | "gather"
  | "open_discussion"
  | "breakout"
  | "reconvene"
  | "decision"
  | "free_form";

export interface PhaseConfig {
  phase: SimulationPhase;
  description: string;
  autoAdvanceTick?: number; // auto-advance after this many ticks in this phase
}

const PHASE_SEQUENCE: PhaseConfig[] = [
  { phase: "setup", description: "Agents read the scenario briefing and form initial thoughts.", autoAdvanceTick: 3 },
  { phase: "gather", description: "Agents move to the Boardroom for discussion.", autoAdvanceTick: 5 },
  { phase: "open_discussion", description: "Free-form debate. Agents discuss the topic openly." },
  { phase: "breakout", description: "Agents may split into sub-groups at different locations." },
  { phase: "reconvene", description: "Agents return to the Boardroom to share findings." },
  { phase: "decision", description: "Final statements and vote." },
];

export class PhaseManager {
  private enabled: boolean;
  private phases: PhaseConfig[];
  private currentIndex = 0;
  private ticksInPhase = 0;

  constructor(enabled = false) {
    this.enabled = enabled;
    this.phases = [...PHASE_SEQUENCE];
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  enable(): void {
    this.enabled = true;
    this.currentIndex = 0;
    this.ticksInPhase = 0;
  }

  disable(): void {
    this.enabled = false;
  }

  getCurrentPhase(): PhaseConfig {
    if (!this.enabled) {
      return { phase: "free_form", description: "Free-form simulation." };
    }
    return this.phases[this.currentIndex] || this.phases[this.phases.length - 1];
  }

  /** Call each tick. Returns new phase if it changed, null otherwise. */
  tick(): PhaseConfig | null {
    if (!this.enabled) return null;

    this.ticksInPhase++;
    const current = this.getCurrentPhase();

    if (current.autoAdvanceTick && this.ticksInPhase >= current.autoAdvanceTick) {
      return this.advancePhase();
    }

    return null;
  }

  /** Manually advance to the next phase. Returns the new phase. */
  advancePhase(): PhaseConfig | null {
    if (this.currentIndex >= this.phases.length - 1) return null;
    this.currentIndex++;
    this.ticksInPhase = 0;
    return this.getCurrentPhase();
  }

  /** Get the phase injection text (guidance for agents). */
  getPhaseGuidance(): string {
    const phase = this.getCurrentPhase();
    switch (phase.phase) {
      case "setup":
        return "You are in the Setup phase. Read the scenario briefing carefully and form your initial thoughts. Go to your office to think.";
      case "gather":
        return "It's time to gather. Move to The Boardroom for the group discussion.";
      case "open_discussion":
        return "Open discussion is underway. Share your perspective and engage with others' arguments.";
      case "breakout":
        return "You may break out into smaller groups. Consider going to the Whiteboard Corner or Library to think through specific aspects.";
      case "reconvene":
        return "Time to reconvene. Return to The Boardroom and share what you've concluded.";
      case "decision":
        return "Final round. Make your recommendation and explain your reasoning. Be clear about your position.";
      default:
        return "";
    }
  }
}
