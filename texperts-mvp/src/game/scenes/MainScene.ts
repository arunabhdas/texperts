import * as Phaser from "phaser";
import { generateMap, TILE_SIZE } from "@/game/map/MapGenerator";
import { ZoneManager } from "@/game/map/ZoneManager";
import { AgentSprite, AgentSpriteConfig } from "@/game/entities/AgentSprite";
import { PathfindingService } from "@/game/pathfinding/PathfindingService";
import { BubbleManager } from "@/game/entities/BubbleManager";
import { EventBus } from "@/game/EventBus";
import { TileType, MapData } from "@/types";

// Default agent configs for the 5 experts
const DEFAULT_AGENTS: AgentSpriteConfig[] = [
  { id: "visionary", name: "The Visionary", role: "CEO", color: 0x4caf50, startTileX: 13, startTileY: 3 },
  { id: "skeptic", name: "The Skeptic", role: "CFO", color: 0xf44336, startTileX: 20, startTileY: 3 },
  { id: "builder", name: "The Builder", role: "CTO", color: 0x2196f3, startTileX: 27, startTileY: 3 },
  { id: "whisperer", name: "The Whisperer", role: "Product", color: 0xffeb3b, startTileX: 32, startTileY: 13 },
  { id: "devil", name: "Devil's Advocate", role: "Advisor", color: 0x9c27b0, startTileX: 32, startTileY: 20 },
];

/**
 * MainScene — renders the Think Tank tile map, agents, and handles interaction.
 */
export class MainScene extends Phaser.Scene {
  private mapData!: MapData;
  private zoneManager!: ZoneManager;
  private pathfinder!: PathfindingService;
  private agents: Map<string, AgentSprite> = new Map();
  private bubbleManager!: BubbleManager;
  private selectedAgent: AgentSprite | null = null;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private connectionGraphics!: Phaser.GameObjects.Graphics;
  private cameraFollowing: string | null = null;
  private activeConnections: Array<{ from: string; to: string; agreement: number; expireAt: number }> = [];

  constructor() {
    super({ key: "MainScene" });
  }

  create(): void {
    // Generate the map
    this.mapData = generateMap();
    this.zoneManager = new ZoneManager(this.mapData.zones);
    this.pathfinder = new PathfindingService(this.mapData.walkable);

    // Render layers
    this.renderGroundLayer();
    this.renderObstacleLayer();
    this.renderZoneOverlays();
    this.renderZoneLabels();

    // Connection lines layer
    this.connectionGraphics = this.add.graphics();
    this.connectionGraphics.setDepth(5);

    // Bubbles + agents
    this.bubbleManager = new BubbleManager(this);
    this.spawnAgents();

    // Camera + controls
    this.setupCamera();
    this.setupControls();
    this.setupAgentInteraction();

    // Listen for external commands
    this.setupEventBusListeners();
  }

  update(): void {
    this.handleCameraMovement();
    this.bubbleManager.updatePositions();
    this.drawConnectionLines();

    // Camera follow
    if (this.cameraFollowing) {
      const agent = this.agents.get(this.cameraFollowing);
      if (agent) {
        const pos = agent.getWorldPosition();
        this.cameras.main.centerOn(pos.x, pos.y);
      }
    }
  }

  // --- Rendering ---

  private renderGroundLayer(): void {
    const { width, height } = this.mapData;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const key = (x + y) % 2 === 0 ? "tile_floor" : "tile_floor_alt";
        this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, key);
      }
    }
  }

  private renderObstacleLayer(): void {
    const { width, height, obstacles } = this.mapData;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = obstacles[y][x];
        if (tile === TileType.Wall) {
          this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, "tile_wall");
        } else if (tile === TileType.Furniture) {
          this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, "tile_furniture");
        } else if (tile === TileType.Door) {
          this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, "tile_door");
        }
      }
    }
  }

  private renderZoneOverlays(): void {
    for (const zone of this.zoneManager.getAllZones()) {
      const { x, y, width, height } = zone.bounds;
      const color = Phaser.Display.Color.HexStringToColor(zone.color).color;
      const overlay = this.add.rectangle(
        x * TILE_SIZE + (width * TILE_SIZE) / 2,
        y * TILE_SIZE + (height * TILE_SIZE) / 2,
        width * TILE_SIZE,
        height * TILE_SIZE,
        color,
        0.08,
      );
      overlay.setDepth(1);
    }
  }

  private renderZoneLabels(): void {
    for (const zone of this.zoneManager.getAllZones()) {
      const { x, y, width } = zone.bounds;
      const labelX = x * TILE_SIZE + (width * TILE_SIZE) / 2;
      const labelY = zone.bounds.y * TILE_SIZE + 12;
      const text = this.add.text(labelX, labelY, zone.name, {
        fontSize: "11px",
        fontFamily: "monospace",
        color: "#666666",
        backgroundColor: "#f5f0e8cc",
        padding: { x: 4, y: 2 },
      });
      text.setOrigin(0.5, 0);
      text.setDepth(2);
    }
  }

  // --- Agents ---

  private spawnAgents(): void {
    for (const cfg of DEFAULT_AGENTS) {
      const agent = new AgentSprite(this, cfg);
      this.agents.set(cfg.id, agent);
      // Register agent position for bubble tracking
      this.bubbleManager.registerAgent(cfg.id, () => agent.getWorldPosition());
    }
  }

  private setupAgentInteraction(): void {
    const testSpeech: Record<string, string> = {
      visionary: "I see a massive consumer opportunity here — 50M potential users!",
      skeptic: "Consumer acquisition costs are 5-10x higher. Show me the unit economics.",
      builder: "We'd need to rebuild the entire UX. That's 6 months minimum.",
      whisperer: "40% of our B2B users came through organic word-of-mouth from individuals.",
      devil: "What if the market opportunity you see is actually a mirage?",
    };

    const testThought: Record<string, string> = {
      visionary: "Need to convince the skeptic with TAM data...",
      skeptic: "The runway math doesn't add up for a pivot.",
      builder: "Could we reuse the existing API layer?",
      whisperer: "My customer interviews tell a different story.",
      devil: "Everyone seems too aligned. Time to push back.",
    };

    for (const agent of Array.from(this.agents.values())) {
      const container = agent.getContainer();

      container.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        if (pointer.leftButtonDown()) {
          this.selectAgent(agent);

          // Test: single click → speech bubble
          this.bubbleManager.show({
            agentId: agent.id,
            type: "speech",
            text: testSpeech[agent.id] || "Hello!",
          });
        }
      });

      // Double-click → thought bubble
      let lastClickTime = 0;
      container.on("pointerdown", () => {
        const now = Date.now();
        if (now - lastClickTime < 400) {
          this.bubbleManager.show({
            agentId: agent.id,
            type: "thought",
            text: testThought[agent.id] || "Hmm...",
          });
        }
        lastClickTime = now;
      });
    }

    // Left-click on empty space: move selected agent there (debug mode)
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!pointer.leftButtonDown()) return;
      // Ignore if we clicked on an agent (handled above)
      if (this.input.hitTestPointer(pointer).length > 0) return;

      if (this.selectedAgent && !this.selectedAgent.isMoving) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const tileX = Math.floor(worldPoint.x / TILE_SIZE);
        const tileY = Math.floor(worldPoint.y / TILE_SIZE);

        // Only move to walkable tiles
        if (
          tileX >= 0 && tileX < this.mapData.width &&
          tileY >= 0 && tileY < this.mapData.height &&
          this.mapData.walkable[tileY][tileX]
        ) {
          this.moveAgentTo(this.selectedAgent.id, tileX, tileY);
        }
      }
    });
  }

  private selectAgent(agent: AgentSprite): void {
    // Deselect previous
    if (this.selectedAgent) {
      this.selectedAgent.deselect();
    }
    // Select new
    agent.select();
    this.selectedAgent = agent;
    EventBus.emit("agent-selected", agent.id);

    // Camera follow on selection
    this.cameraFollowing = agent.id;
  }

  async moveAgentTo(agentId: string, tileX: number, tileY: number): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent || agent.isMoving) return;

    const path = await this.pathfinder.findPath(agent.tileX, agent.tileY, tileX, tileY);
    if (!path || path.length === 0) return;

    await agent.moveTo(path);

    // Check which zone the agent is now in
    const zone = this.zoneManager.getZoneAtTile(agent.tileX, agent.tileY);
    EventBus.emit("agent-moved", agentId, zone?.id ?? null);
  }

  private setupEventBusListeners(): void {
    // External command to move an agent (from server/UI)
    EventBus.on("command-move-agent", (agentId: unknown, tileX: unknown, tileY: unknown) => {
      this.moveAgentTo(agentId as string, tileX as number, tileY as number);
    });

    // External command to show agent path (from server)
    EventBus.on("command-agent-path", async (agentId: unknown, path: unknown) => {
      const agent = this.agents.get(agentId as string);
      if (agent) {
        await agent.moveTo(path as Array<{ x: number; y: number }>);
        const zone = this.zoneManager.getZoneAtTile(agent.tileX, agent.tileY);
        EventBus.emit("agent-moved", agentId, zone?.id ?? null);
      }
    });

    // External command to show a bubble
    EventBus.on("command-show-bubble", (agentId: unknown, type: unknown, text: unknown) => {
      this.bubbleManager.show({
        agentId: agentId as string,
        type: type as "speech" | "thought",
        text: text as string,
      });
    });

    // External command to stream a token to an existing bubble
    EventBus.on("command-stream-token", (agentId: unknown, token: unknown) => {
      this.bubbleManager.appendToken(agentId as string, token as string);
    });

    // External command to dismiss a bubble
    EventBus.on("command-dismiss-bubble", (agentId: unknown) => {
      this.bubbleManager.dismiss(agentId as string);
    });

    // External command to show emote
    EventBus.on("command-show-emote", (agentId: unknown, emoji: unknown) => {
      const agent = this.agents.get(agentId as string);
      if (agent) agent.showEmote(emoji as string);
    });

    // External command to update agent emotion
    EventBus.on("command-set-emotion", (agentId: unknown, emotion: unknown) => {
      const agent = this.agents.get(agentId as string);
      if (agent) agent.setEmotion(emotion as string);
    });

    // External command to show connection line between agents
    EventBus.on("command-show-connection", (fromId: unknown, toId: unknown, agreement: unknown) => {
      this.addConnection(fromId as string, toId as string, agreement as number);
    });

    // External command to stop camera follow
    EventBus.on("command-stop-follow", () => {
      this.cameraFollowing = null;
    });
  }

  // --- Camera ---

  private setupCamera(): void {
    const worldWidth = this.mapData.width * TILE_SIZE;
    const worldHeight = this.mapData.height * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setZoom(1);

    const boardroom = this.zoneManager.getZone("boardroom");
    if (boardroom) {
      this.cameras.main.centerOn(
        boardroom.bounds.x * TILE_SIZE + (boardroom.bounds.width * TILE_SIZE) / 2,
        boardroom.bounds.y * TILE_SIZE + (boardroom.bounds.height * TILE_SIZE) / 2,
      );
    }
  }

  private setupControls(): void {
    if (!this.input.keyboard) return;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _gos: unknown[], _dx: number, dy: number) => {
      const cam = this.cameras.main;
      const newZoom = Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.5, 3);
      cam.setZoom(newZoom);
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.middleButtonDown() || pointer.rightButtonDown()) {
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
        this.cameraFollowing = null; // stop follow on manual pan
      }
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const cam = this.cameras.main;
        cam.scrollX -= (pointer.x - this.dragStartX) / cam.zoom;
        cam.scrollY -= (pointer.y - this.dragStartY) / cam.zoom;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    this.input.on("pointerup", () => {
      this.isDragging = false;
    });
  }

  private handleCameraMovement(): void {
    const cam = this.cameras.main;
    const speed = 5 / cam.zoom;
    if (this.cursors.left?.isDown || this.wasd.A?.isDown) cam.scrollX -= speed;
    if (this.cursors.right?.isDown || this.wasd.D?.isDown) cam.scrollX += speed;
    if (this.cursors.up?.isDown || this.wasd.W?.isDown) cam.scrollY -= speed;
    if (this.cursors.down?.isDown || this.wasd.S?.isDown) cam.scrollY += speed;
  }

  // --- Connection Lines ---

  private drawConnectionLines(): void {
    this.connectionGraphics.clear();
    const now = Date.now();

    // Remove expired connections
    this.activeConnections = this.activeConnections.filter((c) => c.expireAt > now);

    for (const conn of this.activeConnections) {
      const fromAgent = this.agents.get(conn.from);
      const toAgent = this.agents.get(conn.to);
      if (!fromAgent || !toAgent) continue;

      const fromPos = fromAgent.getWorldPosition();
      const toPos = toAgent.getWorldPosition();

      // Color by agreement: green (agree) → yellow (neutral) → red (disagree)
      const t = (conn.agreement + 1) / 2; // normalize -1..1 to 0..1
      const r = Math.floor(255 * (1 - t));
      const g = Math.floor(255 * t);
      const color = (r << 16) | (g << 8) | 0x44;

      const alpha = Math.min(1, (conn.expireAt - now) / 2000) * 0.5;

      this.connectionGraphics.lineStyle(2, color, alpha);
      this.connectionGraphics.beginPath();
      this.connectionGraphics.moveTo(fromPos.x, fromPos.y);
      this.connectionGraphics.lineTo(toPos.x, toPos.y);
      this.connectionGraphics.strokePath();
    }
  }

  addConnection(fromId: string, toId: string, agreement: number): void {
    this.activeConnections.push({
      from: fromId,
      to: toId,
      agreement,
      expireAt: Date.now() + 5000,
    });
  }

  // Public accessors
  getMapData(): MapData { return this.mapData; }
  getZoneManager(): ZoneManager { return this.zoneManager; }
  getAgent(id: string): AgentSprite | undefined { return this.agents.get(id); }
  getAllAgents(): AgentSprite[] { return Array.from(this.agents.values()); }
}
