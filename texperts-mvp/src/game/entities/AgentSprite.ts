import * as Phaser from "phaser";
import { TILE_SIZE } from "@/game/map/MapGenerator";

export interface AgentSpriteConfig {
  id: string;
  name: string;
  role: string;
  color: number;       // hex color e.g. 0x4CAF50
  startTileX: number;
  startTileY: number;
}

const SPRITE_RADIUS = 12;
const BOB_AMPLITUDE = 2;
const BOB_DURATION = 800;

export class AgentSprite {
  public readonly id: string;
  public readonly agentName: string;
  public readonly role: string;
  public readonly color: number;

  public tileX: number;
  public tileY: number;
  public isMoving = false;
  public isSelected = false;

  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private roleText: Phaser.GameObjects.Text;
  private statusText: Phaser.GameObjects.Text;
  private selectionRing: Phaser.GameObjects.Graphics;
  private bobTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, config: AgentSpriteConfig) {
    this.scene = scene;
    this.id = config.id;
    this.agentName = config.name;
    this.role = config.role;
    this.color = config.color;
    this.tileX = config.startTileX;
    this.tileY = config.startTileY;

    const worldX = config.startTileX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = config.startTileY * TILE_SIZE + TILE_SIZE / 2;

    // Container holds all parts of the agent
    this.container = scene.add.container(worldX, worldY);
    this.container.setDepth(10);

    // Selection ring (hidden by default)
    this.selectionRing = scene.add.graphics();
    this.selectionRing.lineStyle(2, 0xffffff, 0.8);
    this.selectionRing.strokeCircle(0, 0, SPRITE_RADIUS + 4);
    this.selectionRing.setVisible(false);
    this.container.add(this.selectionRing);

    // Agent body (colored circle)
    this.body = scene.add.graphics();
    this.body.fillStyle(config.color, 1);
    this.body.fillCircle(0, 0, SPRITE_RADIUS);
    // Darker border
    this.body.lineStyle(2, Phaser.Display.Color.IntegerToColor(config.color).darken(30).color, 1);
    this.body.strokeCircle(0, 0, SPRITE_RADIUS);
    this.container.add(this.body);

    // Inner highlight (gives a slight 3D feel)
    const highlight = scene.add.graphics();
    highlight.fillStyle(0xffffff, 0.25);
    highlight.fillCircle(-3, -3, SPRITE_RADIUS * 0.4);
    this.container.add(highlight);

    // Name label
    this.nameText = scene.add.text(0, SPRITE_RADIUS + 4, config.name, {
      fontSize: "10px",
      fontFamily: "monospace",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
    });
    this.nameText.setOrigin(0.5, 0);
    this.container.add(this.nameText);

    // Role label
    this.roleText = scene.add.text(0, SPRITE_RADIUS + 16, config.role, {
      fontSize: "8px",
      fontFamily: "monospace",
      color: "#aaaaaa",
      stroke: "#000000",
      strokeThickness: 1,
    });
    this.roleText.setOrigin(0.5, 0);
    this.container.add(this.roleText);

    // Status emoji (above head)
    this.statusText = scene.add.text(0, -(SPRITE_RADIUS + 12), "😊", {
      fontSize: "12px",
    });
    this.statusText.setOrigin(0.5, 0.5);
    this.container.add(this.statusText);

    // Make interactive
    const hitArea = new Phaser.Geom.Circle(0, 0, SPRITE_RADIUS + 4);
    this.container.setInteractive(hitArea, Phaser.Geom.Circle.Contains);

    // Start idle bobbing
    this.startIdleBob();
  }

  private startIdleBob(): void {
    this.bobTween = this.scene.tweens.add({
      targets: this.container,
      y: this.container.y - BOB_AMPLITUDE,
      duration: BOB_DURATION,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private stopIdleBob(): void {
    if (this.bobTween) {
      this.bobTween.stop();
      this.bobTween = null;
    }
  }

  select(): void {
    this.isSelected = true;
    this.selectionRing.setVisible(true);
  }

  deselect(): void {
    this.isSelected = false;
    this.selectionRing.setVisible(false);
  }

  setStatus(emoji: string): void {
    this.statusText.setText(emoji);
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  getWorldPosition(): { x: number; y: number } {
    return { x: this.container.x, y: this.container.y };
  }

  /**
   * Move the agent along a path of tile coordinates.
   * Returns a promise that resolves when movement completes.
   */
  async moveTo(path: Array<{ x: number; y: number }>, speedMs = 200): Promise<void> {
    if (path.length === 0) return;

    this.isMoving = true;
    this.setStatus("🚶");
    this.stopIdleBob();

    for (const point of path) {
      await this.tweenToTile(point.x, point.y, speedMs);
      this.tileX = point.x;
      this.tileY = point.y;
    }

    this.isMoving = false;
    this.setStatus("😊");
    this.startIdleBob();
  }

  private tweenToTile(tx: number, ty: number, duration: number): Promise<void> {
    const targetX = tx * TILE_SIZE + TILE_SIZE / 2;
    const targetY = ty * TILE_SIZE + TILE_SIZE / 2;

    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.container,
        x: targetX,
        y: targetY,
        duration,
        ease: "Linear",
        onComplete: () => resolve(),
      });
    });
  }

  /** Snap to a tile instantly (no animation). */
  snapToTile(tx: number, ty: number): void {
    this.tileX = tx;
    this.tileY = ty;
    this.container.setPosition(
      tx * TILE_SIZE + TILE_SIZE / 2,
      ty * TILE_SIZE + TILE_SIZE / 2,
    );
  }

  /** Show an animated emote above the agent that pops up and fades out. */
  showEmote(emoji: string): void {
    const emote = this.scene.add.text(
      this.container.x,
      this.container.y - SPRITE_RADIUS - 20,
      emoji,
      { fontSize: "18px" },
    );
    emote.setOrigin(0.5, 0.5);
    emote.setDepth(20);

    this.scene.tweens.add({
      targets: emote,
      y: emote.y - 30,
      alpha: 0,
      scale: 1.5,
      duration: 1200,
      ease: "Cubic.easeOut",
      onComplete: () => emote.destroy(),
    });
  }

  /** Update the status emoji based on emotion string. */
  setEmotion(emotion: string): void {
    const emojiMap: Record<string, string> = {
      confident: "😎",
      uncertain: "🤔",
      skeptical: "🧐",
      excited: "🤩",
      alarmed: "😰",
      neutral: "😊",
      amused: "😏",
      thinking: "💭",
      speaking: "💬",
      moving: "🚶",
    };
    this.statusText.setText(emojiMap[emotion] || "😊");
  }

  destroy(): void {
    this.stopIdleBob();
    this.container.destroy();
  }
}
