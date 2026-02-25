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

/** Size at which SVG agent textures are rasterized. */
export const AGENT_TEXTURE_SIZE = 256;

/**
 * BootScene — generates all programmatic textures.
 * Tiles use Canvas 2D with gradients and noise.
 * Agent bodies use SVG for resolution-independent rendering.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    // Load SVG agent body textures at high resolution
    for (const [colorKey, palette] of Object.entries(GHIBLI_PALETTES)) {
      const svg = this.buildAgentSVG(palette, String(colorKey));
      const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
      this.load.svg(`agent_body_${colorKey}`, dataUrl, {
        width: AGENT_TEXTURE_SIZE,
        height: AGENT_TEXTURE_SIZE,
      });
    }
  }

  create(): void {
    this.generateTileTextures();
    this.scene.start("MainScene");
  }

  /**
   * Build an SVG string for a Ghibli-style agent body.
   * Uses radial gradients for soft shading, a specular highlight, and a warm outline.
   */
  private buildAgentSVG(
    palette: { light: string; mid: string; dark: string; outline: string },
    id: string,
  ): string {
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">`,
      `<defs>`,
      // Ground shadow
      `<radialGradient id="sh_${id}" cx="50%" cy="78%" r="32%">`,
      `<stop offset="0%" stop-color="#000" stop-opacity="0.15"/>`,
      `<stop offset="100%" stop-color="#000" stop-opacity="0"/>`,
      `</radialGradient>`,
      // Body gradient (off-center for 3D feel)
      `<radialGradient id="bd_${id}" cx="44%" cy="42%" r="44%">`,
      `<stop offset="0%" stop-color="${palette.light}"/>`,
      `<stop offset="100%" stop-color="${palette.mid}"/>`,
      `</radialGradient>`,
      // Specular highlight
      `<radialGradient id="hl_${id}" cx="40%" cy="36%" r="20%">`,
      `<stop offset="0%" stop-color="white" stop-opacity="0.4"/>`,
      `<stop offset="100%" stop-color="white" stop-opacity="0"/>`,
      `</radialGradient>`,
      // Subtle inner glow
      `<radialGradient id="ig_${id}" cx="50%" cy="50%" r="50%">`,
      `<stop offset="70%" stop-color="${palette.mid}" stop-opacity="0"/>`,
      `<stop offset="100%" stop-color="${palette.dark}" stop-opacity="0.25"/>`,
      `</radialGradient>`,
      `</defs>`,
      // Ground shadow ellipse
      `<ellipse cx="32" cy="44" rx="20" ry="7" fill="url(#sh_${id})"/>`,
      // Main body
      `<circle cx="32" cy="30" r="22" fill="url(#bd_${id})"/>`,
      // Inner edge darkening
      `<circle cx="32" cy="30" r="22" fill="url(#ig_${id})"/>`,
      // Specular bloom
      `<circle cx="27" cy="24" r="12" fill="url(#hl_${id})"/>`,
      // Warm outline
      `<circle cx="32" cy="30" r="22" fill="none" stroke="${palette.outline}" stroke-width="1.5" stroke-opacity="0.6"/>`,
      `</svg>`,
    ].join("");
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
}
