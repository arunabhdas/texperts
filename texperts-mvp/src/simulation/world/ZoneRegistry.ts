import { ZONE_DEFS } from "@/game/map/MapGenerator";
import { ZoneDefinition } from "@/types";

/**
 * Server-side zone registry — maps zone names to tile coordinates.
 */
export class ZoneRegistry {
  private zones: Map<string, ZoneDefinition> = new Map();

  constructor() {
    for (const z of ZONE_DEFS) {
      this.zones.set(z.id, z);
    }
  }

  getZone(id: string): ZoneDefinition | undefined {
    return this.zones.get(id);
  }

  getSpawnTile(zoneId: string): { x: number; y: number } | null {
    const zone = this.zones.get(zoneId);
    return zone ? { ...zone.spawnTile } : null;
  }

  /** Find which zone contains a given tile. */
  getZoneAtTile(tileX: number, tileY: number): ZoneDefinition | null {
    for (const zone of Array.from(this.zones.values())) {
      const { x, y, width, height } = zone.bounds;
      if (tileX >= x && tileX < x + width && tileY >= y && tileY < y + height) {
        return zone;
      }
    }
    return null;
  }

  getAllZoneIds(): string[] {
    return Array.from(this.zones.keys());
  }

  getAllZones(): ZoneDefinition[] {
    return Array.from(this.zones.values());
  }
}
