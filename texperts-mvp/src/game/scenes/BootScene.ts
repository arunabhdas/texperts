import * as Phaser from "phaser";
import { TILE_SIZE } from "@/game/map/MapGenerator";

// Ghibli twilight tile palette
const TILE_COLORS = {
  floor:     { top: "#423c36", bottom: "#3d3832" },
  floor_alt: { top: "#3a3430", bottom: "#352f2a" },
  wall:      { top: "#2e2830", bottom: "#28222a" },
  furniture: { top: "#60503a", bottom: "#5a4a2e" },
  door:      { top: "#70645a", bottom: "#6a5e50" },
};

// Ghibli agent palettes keyed by original hex color
export const GHIBLI_PALETTES: Record<number, { light: string; mid: string; dark: string; outline: string }> = {
  0x4caf50: { light: "#9ED8A0", mid: "#6BB86E", dark: "#4A8A4D", outline: "#3D6B3F" }, // Visionary
  0xf44336: { light: "#E8A49E", mid: "#C4706A", dark: "#9E4F4A", outline: "#7A3B37" }, // Skeptic
  0x2196f3: { light: "#9EC8E8", mid: "#6A9FC4", dark: "#4A7A9E", outline: "#375B7A" }, // Builder
  0xffeb3b: { light: "#F0DDA0", mid: "#D4BA6A", dark: "#B09848", outline: "#8A7638" }, // Whisperer
  0x9c27b0: { light: "#C8A0D8", mid: "#9E72B4", dark: "#7A508A", outline: "#5E3D6B" }, // Devil
};

/**
 * BootScene — generates all programmatic textures using Canvas 2D API.
 * Ghibli-inspired warm twilight aesthetic with gradients and watercolor noise.
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
    this.generateAgentTextures();
    this.scene.start("MainScene");
  }

  private generateTileTextures(): void {
    const ts = TILE_SIZE;
    this.generateSoftTile("tile_floor", ts, ts, TILE_COLORS.floor);
    this.generateSoftTile("tile_floor_alt", ts, ts, TILE_COLORS.floor_alt);
    this.generateSoftTile("tile_wall", ts, ts, TILE_COLORS.wall);
    this.generateSoftTile("tile_furniture", ts, ts, TILE_COLORS.furniture);
    this.generateSoftTile("tile_door", ts, ts, TILE_COLORS.door);
  }

  private generateSoftTile(key: string, w: number, h: number, colors: { top: string; bottom: string }): void {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    // Subtle top-to-bottom gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, colors.top);
    grad.addColorStop(1, colors.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Soft inner border (warm highlight at top, shadow at bottom)
    ctx.strokeStyle = "rgba(255,248,240,0.04)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    // Watercolor noise jitter
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      const jitter = (Math.random() - 0.5) * 4;
      data[i] = Math.max(0, Math.min(255, data[i] + jitter));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + jitter));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + jitter));
    }
    ctx.putImageData(imageData, 0, 0);

    this.textures.addCanvas(key, canvas);
  }

  private generateAgentTextures(): void {
    for (const [colorKey, palette] of Object.entries(GHIBLI_PALETTES)) {
      this.generateAgentBody(`agent_body_${colorKey}`, palette);
    }
  }

  private generateAgentBody(key: string, palette: { light: string; mid: string; dark: string; outline: string }): void {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    const cx = size / 2;
    const cy = size / 2 - 2;
    const bodyRadius = 22;

    // 1. Ground shadow ellipse
    const shadowGrad = ctx.createRadialGradient(cx, cy + 10, 0, cx, cy + 10, 20);
    shadowGrad.addColorStop(0, "rgba(0,0,0,0.12)");
    shadowGrad.addColorStop(1, "rgba(0,0,0,0.0)");
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Main body radial gradient
    const bodyGrad = ctx.createRadialGradient(cx - 4, cy - 4, 0, cx, cy, bodyRadius);
    bodyGrad.addColorStop(0, palette.light);
    bodyGrad.addColorStop(1, palette.mid);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, bodyRadius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Inner highlight (specular bloom)
    const hlGrad = ctx.createRadialGradient(cx - 5, cy - 6, 0, cx - 5, cy - 6, 12);
    hlGrad.addColorStop(0, "rgba(255,255,255,0.35)");
    hlGrad.addColorStop(1, "rgba(255,255,255,0.0)");
    ctx.fillStyle = hlGrad;
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 6, 12, 0, Math.PI * 2);
    ctx.fill();

    // 4. Warm colored outline
    ctx.strokeStyle = palette.outline + "99"; // ~0.6 alpha
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, bodyRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 5. Watercolor noise pass
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 10) continue;
      const jitter = (Math.random() - 0.5) * 6;
      data[i] = Math.max(0, Math.min(255, data[i] + jitter));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + jitter));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + jitter));
    }
    ctx.putImageData(imageData, 0, 0);

    this.textures.addCanvas(key, canvas);
  }
}
