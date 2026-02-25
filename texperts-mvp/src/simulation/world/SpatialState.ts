import { ZoneRegistry } from "./ZoneRegistry";

interface AgentPosition {
  agentId: string;
  tileX: number;
  tileY: number;
  zoneId: string | null;
}

/**
 * Tracks which agent is at which tile/zone.
 */
export class SpatialState {
  private positions: Map<string, AgentPosition> = new Map();
  private zoneRegistry: ZoneRegistry;

  constructor(zoneRegistry: ZoneRegistry) {
    this.zoneRegistry = zoneRegistry;
  }

  setPosition(agentId: string, tileX: number, tileY: number): void {
    const zone = this.zoneRegistry.getZoneAtTile(tileX, tileY);
    this.positions.set(agentId, {
      agentId,
      tileX,
      tileY,
      zoneId: zone?.id ?? null,
    });
  }

  getPosition(agentId: string): AgentPosition | null {
    return this.positions.get(agentId) ?? null;
  }

  getZone(agentId: string): string | null {
    return this.positions.get(agentId)?.zoneId ?? null;
  }

  /** Get all agents in the same zone as the given agent. */
  getAgentsInSameZone(agentId: string): string[] {
    const zone = this.getZone(agentId);
    if (!zone) return [];
    return Array.from(this.positions.values())
      .filter((p) => p.zoneId === zone && p.agentId !== agentId)
      .map((p) => p.agentId);
  }

  /** Get all agents in a specific zone. */
  getAgentsInZone(zoneId: string): string[] {
    return Array.from(this.positions.values())
      .filter((p) => p.zoneId === zoneId)
      .map((p) => p.agentId);
  }

  getAllPositions(): AgentPosition[] {
    return Array.from(this.positions.values());
  }
}
