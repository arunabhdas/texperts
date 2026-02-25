import * as Phaser from "phaser";
import { TILE_SIZE } from "@/game/map/MapGenerator";

/**
 * BootScene — generates all programmatic textures (no external assets).
 * Transitions to MainScene when done.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    // No external assets to load
  }

  create(): void {
    this.generateTileTextures();
    this.scene.start("MainScene");
  }

  private generateTileTextures(): void {
    const ts = TILE_SIZE;

    // Floor tile — light beige
    this.generateRect("tile_floor", ts, ts, 0xf5f0e8, 1);

    // Floor tile alt — slightly darker for checkerboard
    this.generateRect("tile_floor_alt", ts, ts, 0xe8e0d0, 1);

    // Wall tile — dark gray
    this.generateRect("tile_wall", ts, ts, 0x4a4a4a, 1);

    // Furniture tile — brown
    this.generateRect("tile_furniture", ts, ts, 0x8b6914, 1);

    // Door tile — lighter than floor
    this.generateRect("tile_door", ts, ts, 0xddd5c0, 1);
  }

  private generateRect(
    key: string,
    width: number,
    height: number,
    color: number,
    alpha: number,
  ): void {
    const g = this.add.graphics();
    g.fillStyle(color, alpha);
    g.fillRect(0, 0, width, height);

    // Add subtle border for tile definition
    g.lineStyle(1, 0x00000020, 0.15);
    g.strokeRect(0, 0, width, height);

    g.generateTexture(key, width, height);
    g.destroy();
  }
}
