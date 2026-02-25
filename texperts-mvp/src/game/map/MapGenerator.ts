import { TileType, MapData, ZoneDefinition } from "@/types";

const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;
const TILE_SIZE = 32;

// Zone definitions — positions and sizes in tile coordinates
const ZONE_DEFS: ZoneDefinition[] = [
  {
    id: "boardroom",
    name: "The Boardroom",
    description: "Central meeting space for group debates.",
    color: "#4CAF50",
    bounds: { x: 14, y: 10, width: 12, height: 8 },
    objects: ["conference_table", "projector_screen", "chairs"],
    spawnTile: { x: 20, y: 14 },
  },
  {
    id: "whiteboard",
    name: "Whiteboard Corner",
    description: "Brainstorming zone for creative thinking.",
    color: "#2196F3",
    bounds: { x: 1, y: 1, width: 8, height: 7 },
    objects: ["whiteboard", "markers"],
    spawnTile: { x: 5, y: 4 },
  },
  {
    id: "library",
    name: "The Library",
    description: "Research and reflection area.",
    color: "#9C27B0",
    bounds: { x: 30, y: 1, width: 9, height: 8 },
    objects: ["bookshelves", "reading_desk", "research_terminal"],
    spawnTile: { x: 34, y: 5 },
  },
  {
    id: "breakroom",
    name: "The Break Room",
    description: "Casual encounters and unplanned conversations.",
    color: "#FF9800",
    bounds: { x: 1, y: 21, width: 8, height: 8 },
    objects: ["coffee_machine", "snack_table", "couch"],
    spawnTile: { x: 5, y: 25 },
  },
  {
    id: "office_visionary",
    name: "Office: Visionary",
    description: "The Visionary's private office.",
    color: "#4CAF50",
    bounds: { x: 11, y: 1, width: 5, height: 5 },
    objects: ["desk", "vision_board"],
    spawnTile: { x: 13, y: 3 },
  },
  {
    id: "office_skeptic",
    name: "Office: Skeptic",
    description: "The Skeptic's private office.",
    color: "#F44336",
    bounds: { x: 18, y: 1, width: 5, height: 5 },
    objects: ["desk", "spreadsheet_monitor"],
    spawnTile: { x: 20, y: 3 },
  },
  {
    id: "office_builder",
    name: "Office: Builder",
    description: "The Builder's private office.",
    color: "#2196F3",
    bounds: { x: 25, y: 1, width: 4, height: 5 },
    objects: ["desk", "code_terminal"],
    spawnTile: { x: 27, y: 3 },
  },
  {
    id: "office_whisperer",
    name: "Office: Customer Whisperer",
    description: "The Customer Whisperer's private office.",
    color: "#FFEB3B",
    bounds: { x: 30, y: 11, width: 5, height: 5 },
    objects: ["desk", "customer_feedback_wall"],
    spawnTile: { x: 32, y: 13 },
  },
  {
    id: "office_devil",
    name: "Office: Devil's Advocate",
    description: "The Devil's Advocate's private office.",
    color: "#9C27B0",
    bounds: { x: 30, y: 18, width: 5, height: 5 },
    objects: ["desk", "devil_figurine"],
    spawnTile: { x: 32, y: 20 },
  },
  {
    id: "podium",
    name: "The Podium",
    description: "Presentation area for formal statements.",
    color: "#607D8B",
    bounds: { x: 14, y: 22, width: 12, height: 6 },
    objects: ["lectern", "audience_seats"],
    spawnTile: { x: 20, y: 25 },
  },
];

function createEmptyGrid<T>(width: number, height: number, fill: T): T[][] {
  return Array.from({ length: height }, () => Array(width).fill(fill));
}

function isInsideZone(x: number, y: number, z: ZoneDefinition): boolean {
  return x >= z.bounds.x && x < z.bounds.x + z.bounds.width &&
         y >= z.bounds.y && y < z.bounds.y + z.bounds.height;
}

function isOnZoneBorder(x: number, y: number, z: ZoneDefinition): boolean {
  if (!isInsideZone(x, y, z)) return false;
  return x === z.bounds.x || x === z.bounds.x + z.bounds.width - 1 ||
         y === z.bounds.y || y === z.bounds.y + z.bounds.height - 1;
}

export function generateMap(): MapData {
  const ground = createEmptyGrid(MAP_WIDTH, MAP_HEIGHT, TileType.Floor);
  const obstacles = createEmptyGrid(MAP_WIDTH, MAP_HEIGHT, 0);
  const walkable = createEmptyGrid(MAP_WIDTH, MAP_HEIGHT, true);

  // 1. Perimeter walls
  for (let x = 0; x < MAP_WIDTH; x++) {
    obstacles[0][x] = TileType.Wall;
    obstacles[MAP_HEIGHT - 1][x] = TileType.Wall;
    walkable[0][x] = false;
    walkable[MAP_HEIGHT - 1][x] = false;
  }
  for (let y = 0; y < MAP_HEIGHT; y++) {
    obstacles[y][0] = TileType.Wall;
    obstacles[y][MAP_WIDTH - 1] = TileType.Wall;
    walkable[y][0] = false;
    walkable[y][MAP_WIDTH - 1] = false;
  }

  // 2. Room walls (zone borders) with doorways
  for (const zone of ZONE_DEFS) {
    const { x: zx, y: zy, width: zw, height: zh } = zone.bounds;

    for (let x = zx; x < zx + zw; x++) {
      for (let y = zy; y < zy + zh; y++) {
        if (isOnZoneBorder(x, y, zone)) {
          // Place wall on border
          obstacles[y][x] = TileType.Wall;
          walkable[y][x] = false;
        }
      }
    }

    // Create doorways (1-2 tile openings on each accessible side)
    // Primary doorway: bottom-center for top rooms, top-center for bottom rooms
    // Secondary doorway: right-center for left rooms, left-center for right rooms
    const doorways = getDoorways(zone);
    for (const d of doorways) {
      if (d.x >= 0 && d.x < MAP_WIDTH && d.y >= 0 && d.y < MAP_HEIGHT) {
        obstacles[d.y][d.x] = TileType.Door;
        walkable[d.y][d.x] = true;
      }
    }
  }

  // 3. Place furniture inside rooms
  for (const zone of ZONE_DEFS) {
    placeFurniture(zone, obstacles, walkable);
  }

  return {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    tileSize: TILE_SIZE,
    ground,
    obstacles,
    walkable,
    zones: ZONE_DEFS,
  };
}

function getDoorways(zone: ZoneDefinition): Array<{ x: number; y: number }> {
  const { x, y, width, height } = zone.bounds;
  const doors: Array<{ x: number; y: number }> = [];

  // Determine best doorway positions based on zone location
  const centerX = x + Math.floor(width / 2);
  const centerY = y + Math.floor(height / 2);

  // Bottom doorway (open to hallway below)
  if (y + height < MAP_HEIGHT - 1) {
    doors.push({ x: centerX, y: y + height - 1 });
    doors.push({ x: centerX, y: y + height }); // also clear the tile outside
  }

  // Top doorway
  if (y > 1) {
    doors.push({ x: centerX, y: y });
    doors.push({ x: centerX, y: y - 1 });
  }

  // Left doorway
  if (x > 1) {
    doors.push({ x: x, y: centerY });
    doors.push({ x: x - 1, y: centerY });
  }

  // Right doorway
  if (x + width < MAP_WIDTH - 1) {
    doors.push({ x: x + width - 1, y: centerY });
    doors.push({ x: x + width, y: centerY });
  }

  return doors;
}

function placeFurniture(
  zone: ZoneDefinition,
  obstacles: number[][],
  walkable: boolean[][],
): void {
  const { x, y, width, height } = zone.bounds;
  // Place 1-3 furniture tiles inside the room (not on borders, not on spawn tile)
  const interiorX = x + 2;
  const interiorY = y + 2;

  const furniturePositions: Array<{ x: number; y: number }> = [];

  // Different furniture layouts per zone type
  if (zone.id === "boardroom") {
    // Central conference table (horizontal line)
    for (let fx = x + 3; fx < x + width - 3; fx++) {
      furniturePositions.push({ x: fx, y: y + Math.floor(height / 2) });
    }
  } else if (zone.id === "library") {
    // Bookshelves along top wall
    for (let fx = x + 2; fx < x + width - 2; fx += 2) {
      furniturePositions.push({ x: fx, y: y + 2 });
    }
  } else if (zone.id === "breakroom") {
    // Snack table + couch
    furniturePositions.push({ x: x + 3, y: y + 3 });
    furniturePositions.push({ x: x + 5, y: y + 5 });
  } else if (zone.id === "podium") {
    // Lectern in front center
    furniturePositions.push({ x: x + Math.floor(width / 2), y: y + 2 });
  } else if (zone.id.startsWith("office_")) {
    // Desk in corner
    if (interiorX < x + width - 1 && interiorY < y + height - 1) {
      furniturePositions.push({ x: interiorX, y: interiorY });
    }
  }

  for (const pos of furniturePositions) {
    // Don't place on spawn tile or outside bounds
    if (
      pos.x > 0 && pos.x < MAP_WIDTH - 1 &&
      pos.y > 0 && pos.y < MAP_HEIGHT - 1 &&
      !(pos.x === zone.spawnTile.x && pos.y === zone.spawnTile.y) &&
      obstacles[pos.y][pos.x] !== TileType.Wall &&
      obstacles[pos.y][pos.x] !== TileType.Door
    ) {
      obstacles[pos.y][pos.x] = TileType.Furniture;
      walkable[pos.y][pos.x] = false;
    }
  }
}

export { ZONE_DEFS, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE };
