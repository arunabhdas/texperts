import { ZoneDefinition } from "@/types";

export class ZoneManager {
  private zones: Map<string, ZoneDefinition> = new Map();

  constructor(zones: ZoneDefinition[]) {
    for (const z of zones) {
      this.zones.set(z.id, z);
    }
  }

  getZone(id: string): ZoneDefinition | undefined {
    return this.zones.get(id);
  }

  getAllZones(): ZoneDefinition[] {
    return Array.from(this.zones.values());
  }

  getZoneAtTile(tileX: number, tileY: number): ZoneDefinition | null {
    for (const zone of Array.from(this.zones.values())) {
      const { x, y, width, height } = zone.bounds;
      if (tileX >= x && tileX < x + width && tileY >= y && tileY < y + height) {
        return zone;
      }
    }
    return null;
  }

  getSpawnTile(zoneId: string): { x: number; y: number } | null {
    const zone = this.zones.get(zoneId);
    return zone ? zone.spawnTile : null;
  }

  getZoneNames(): string[] {
    return Array.from(this.zones.values()).map((z) => z.name);
  }
}
