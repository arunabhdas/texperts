import * as Phaser from "phaser";
import { BootScene } from "@/game/scenes/BootScene";
import { MainScene } from "@/game/scenes/MainScene";

/** Device pixel ratio clamped to [1, 2] for crisp rendering on HiDPI displays. */
export const GAME_DPR =
  typeof window !== "undefined"
    ? Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
    : 1;

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: Math.round(1280 * GAME_DPR),
    height: Math.round(720 * GAME_DPR),
    backgroundColor: "#1e1b2e",
    scene: [BootScene, MainScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      pixelArt: false,
      antialias: true,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
  };
}
