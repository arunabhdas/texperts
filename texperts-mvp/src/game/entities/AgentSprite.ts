import * as Phaser from "phaser";
import { TILE_SIZE } from "@/game/map/MapGenerator";
import { GHIBLI_PALETTES } from "@/game/scenes/BootScene";

export interface AgentSpriteConfig {
  id: string;
  name: string;
  role: string;
  color: number;       // hex color e.g. 0x4CAF50
  startTileX: number;
  startTileY: number;
}

const SPRITE_RADIUS = 14;
const BOB_AMPLITUDE = 1.5;
const BOB_DURATION = 1400;
const BODY_TEXTURE_SIZE = 64;
const BODY_DISPLAY_SIZE = 28;
const BODY_SCALE = BODY_DISPLAY_SIZE / BODY_TEXTURE_SIZE;

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
  private body: Phaser.GameObjects.Image;
  private nameText: Phaser.GameObjects.Text;
  private roleText: Phaser.GameObjects.Text;
  private statusText: Phaser.GameObjects.Text;
  private selectionRing: Phaser.GameObjects.Graphics;
  private bobTween: Phaser.Tweens.Tween | null = null;
  private breatheTween: Phaser.Tweens.Tween | null = null;
  private selectionPulseTween: Phaser.Tweens.Tween | null = null;

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

    // Get palette for this agent color
    const palette = GHIBLI_PALETTES[config.color];

    // Container holds all parts of the agent
    this.container = scene.add.container(worldX, worldY);
    this.container.setDepth(10);

    // Selection ring (hidden by default) — warm gold
    this.selectionRing = scene.add.graphics();
    this.selectionRing.lineStyle(2, 0xd4a857, 0.5);
    this.selectionRing.strokeCircle(0, 0, SPRITE_RADIUS + 5);
    this.selectionRing.setVisible(false);
    this.container.add(this.selectionRing);

    // Agent body — pre-baked gradient texture from BootScene
    const textureKey = `agent_body_${config.color}`;
    this.body = scene.add.image(0, -2, textureKey);
    this.body.setScale(BODY_SCALE);
    this.container.add(this.body);

    // Name label — sans-serif, warm off-white, colored stroke
    const strokeColor = palette ? palette.outline : "#333333";
    this.nameText = scene.add.text(0, SPRITE_RADIUS + 4, config.name, {
      fontSize: "10px",
      fontFamily: "sans-serif",
      color: "#e8dfd0",
      stroke: strokeColor,
      strokeThickness: 2,
    });
    this.nameText.setOrigin(0.5, 0);
    this.container.add(this.nameText);

    // Role label — sans-serif, warm gray
    this.roleText = scene.add.text(0, SPRITE_RADIUS + 16, config.role, {
      fontSize: "8px",
      fontFamily: "sans-serif",
      color: "#a89e8c",
      stroke: "#1a1520",
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

    // Start idle bobbing + breathing with random phase offset
    const phaseDelay = Math.random() * BOB_DURATION;
    scene.time.delayedCall(phaseDelay, () => {
      this.startIdleBob();
      this.startBreathing();
    });
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

  private startBreathing(): void {
    this.breatheTween = this.scene.tweens.add({
      targets: this.body,
      scaleX: BODY_SCALE * 1.02,
      scaleY: BODY_SCALE * 1.02,
      duration: BOB_DURATION,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private stopBreathing(): void {
    if (this.breatheTween) {
      this.breatheTween.stop();
      this.breatheTween = null;
      this.body.setScale(BODY_SCALE);
    }
  }

  select(): void {
    this.isSelected = true;
    this.selectionRing.setVisible(true);

    // Pulsing gold ring
    this.selectionPulseTween = this.scene.tweens.add({
      targets: this.selectionRing,
      alpha: { from: 0.4, to: 0.7 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  deselect(): void {
    this.isSelected = false;
    this.selectionRing.setVisible(false);
    if (this.selectionPulseTween) {
      this.selectionPulseTween.stop();
      this.selectionPulseTween = null;
    }
    this.selectionRing.setAlpha(1);
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
    this.stopBreathing();

    for (const point of path) {
      await this.tweenToTile(point.x, point.y, speedMs);
      this.tileX = point.x;
      this.tileY = point.y;
    }

    this.isMoving = false;
    this.setStatus("😊");
    this.startIdleBob();
    this.startBreathing();
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
        ease: "Sine.easeInOut",
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
    this.stopBreathing();
    if (this.selectionPulseTween) {
      this.selectionPulseTween.stop();
    }
    this.container.destroy();
  }
}
