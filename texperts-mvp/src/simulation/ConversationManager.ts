/**
 * Tracks active conversations between agents in the same zone.
 */

export interface Conversation {
  id: string;
  zoneId: string;
  participants: Set<string>;
  turns: ConversationTurn[];
  startTick: number;
  active: boolean;
}

export interface ConversationTurn {
  agentId: string;
  agentName: string;
  content: string;
  tick: number;
}

let conversationCounter = 0;

export class ConversationManager {
  private conversations: Map<string, Conversation> = new Map();
  // Zone → active conversation id
  private activeByZone: Map<string, string> = new Map();

  /** Start or join a conversation in a zone. */
  ensureConversation(zoneId: string, tick: number): Conversation {
    const existing = this.activeByZone.get(zoneId);
    if (existing) {
      const conv = this.conversations.get(existing);
      if (conv && conv.active) return conv;
    }

    const id = `conv_${++conversationCounter}`;
    const conv: Conversation = {
      id,
      zoneId,
      participants: new Set(),
      turns: [],
      startTick: tick,
      active: true,
    };
    this.conversations.set(id, conv);
    this.activeByZone.set(zoneId, id);
    return conv;
  }

  /** Add a participant to the active conversation in their zone. */
  addParticipant(zoneId: string, agentId: string, tick: number): void {
    const conv = this.ensureConversation(zoneId, tick);
    conv.participants.add(agentId);
  }

  /** Remove a participant (they left the zone). End conversation if empty. */
  removeParticipant(zoneId: string, agentId: string): void {
    const convId = this.activeByZone.get(zoneId);
    if (!convId) return;
    const conv = this.conversations.get(convId);
    if (!conv) return;

    conv.participants.delete(agentId);
    if (conv.participants.size < 2) {
      conv.active = false;
      this.activeByZone.delete(zoneId);
    }
  }

  /** Add a speech turn to the conversation. */
  addTurn(zoneId: string, agentId: string, agentName: string, content: string, tick: number): void {
    const conv = this.ensureConversation(zoneId, tick);
    conv.participants.add(agentId);
    conv.turns.push({ agentId, agentName, content, tick });
  }

  /** Get recent conversation turns for a zone. */
  getRecentTurns(zoneId: string, limit = 10): ConversationTurn[] {
    const convId = this.activeByZone.get(zoneId);
    if (!convId) return [];
    const conv = this.conversations.get(convId);
    if (!conv) return [];
    return conv.turns.slice(-limit);
  }

  /** Check if there's an active conversation in a zone. */
  hasActiveConversation(zoneId: string): boolean {
    const convId = this.activeByZone.get(zoneId);
    if (!convId) return false;
    const conv = this.conversations.get(convId);
    return !!conv?.active;
  }

  /** Get all conversations (for export/replay). */
  getAll(): Conversation[] {
    return Array.from(this.conversations.values());
  }
}
