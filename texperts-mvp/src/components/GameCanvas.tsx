"use client";

import { useEffect, useRef } from "react";

const PHASER_CONTAINER_ID = "phaser-game";

export default function GameCanvas() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gameRef = useRef<any>(null);

  useEffect(() => {
    // Dynamic import — Phaser must only run in the browser
    async function initPhaser() {
      const PhaserModule = await import("phaser");
      const { createGameConfig } = await import("@/game/config");

      if (gameRef.current) return; // already initialized

      const config = createGameConfig(PHASER_CONTAINER_ID);
      gameRef.current = new PhaserModule.Game(config);
    }

    initPhaser();

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      id={PHASER_CONTAINER_ID}
      className="w-full h-full flex items-center justify-center"
    />
  );
}
