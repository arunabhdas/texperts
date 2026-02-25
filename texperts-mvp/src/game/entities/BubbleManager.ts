import * as Phaser from "phaser";

// --- Types ---

export type BubbleType = "speech" | "thought";

export interface BubbleRequest {
  agentId: string;
  type: BubbleType;
  text: string;
  duration?: number;    // ms before auto-dismiss (default 5000)
  streaming?: boolean;  // if true, text reveals via typewriter
}

interface ActiveBubble {
  agentId: string;
  type: BubbleType;
  container: Phaser.GameObjects.Container;
  textObj: Phaser.GameObjects.Text;
  fullText: string;
  revealIndex: number;
  revealTimer?: Phaser.Time.TimerEvent;
  dismissTimer?: Phaser.Time.TimerEvent;
}

// --- Constants ---

const BUBBLE_MAX_WIDTH = 200;
const BUBBLE_PADDING = 10;
const BUBBLE_OFFSET_Y = -45;     // above the agent
const TYPEWRITER_SPEED = 30;     // ms per character
const DEFAULT_DURATION = 5000;
const POP_IN_DURATION = 200;
const FADE_OUT_DURATION = 300;
const POINTER_SIZE = 8;

/**
 * BubbleManager — handles speech and thought bubbles for all agents.
 * One bubble active per agent at a time; extras are queued.
 */
export class BubbleManager {
  private scene: Phaser.Scene;
  private activeBubbles: Map<string, ActiveBubble> = new Map();
  private queues: Map<string, BubbleRequest[]> = new Map();

  // Agents must be registered so we can track their position
  private agentPositionFns: Map<string, () => { x: number; y: number }> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Register an agent's position function so bubbles follow them. */
  registerAgent(agentId: string, getPosition: () => { x: number; y: number }): void {
    this.agentPositionFns.set(agentId, getPosition);
  }

  /** Show a bubble. If one is already active for this agent, queue it. */
  show(request: BubbleRequest): void {
    const active = this.activeBubbles.get(request.agentId);
    if (active) {
      // Queue it
      if (!this.queues.has(request.agentId)) {
        this.queues.set(request.agentId, []);
      }
      this.queues.get(request.agentId)!.push(request);
      return;
    }
    this.createBubble(request);
  }

  /** Append a streaming token to an existing bubble. */
  appendToken(agentId: string, token: string): void {
    const active = this.activeBubbles.get(agentId);
    if (!active) return;
    active.fullText += token;
    // If not in typewriter mode, just update immediately
    if (!active.revealTimer) {
      active.textObj.setText(active.fullText);
      this.resizeBubbleBackground(active);
    }
  }

  /** Update all bubble positions to follow their agents. Called each frame. */
  updatePositions(): void {
    for (const [agentId, bubble] of Array.from(this.activeBubbles.entries())) {
      const getPos = this.agentPositionFns.get(agentId);
      if (getPos) {
        const pos = getPos();
        bubble.container.setPosition(pos.x, pos.y + BUBBLE_OFFSET_Y);
      }
    }
  }

  /** Dismiss a specific agent's active bubble. */
  dismiss(agentId: string): void {
    const active = this.activeBubbles.get(agentId);
    if (!active) return;

    // Fade out
    this.scene.tweens.add({
      targets: active.container,
      alpha: 0,
      duration: FADE_OUT_DURATION,
      onComplete: () => {
        active.revealTimer?.destroy();
        active.dismissTimer?.destroy();
        active.container.destroy();
        this.activeBubbles.delete(agentId);

        // Process queue
        const queue = this.queues.get(agentId);
        if (queue && queue.length > 0) {
          const next = queue.shift()!;
          this.createBubble(next);
        }
      },
    });
  }

  /** Dismiss all bubbles. */
  dismissAll(): void {
    for (const agentId of Array.from(this.activeBubbles.keys())) {
      this.dismiss(agentId);
    }
  }

  // --- Private ---

  private createBubble(request: BubbleRequest): void {
    const getPos = this.agentPositionFns.get(request.agentId);
    if (!getPos) return;

    const pos = getPos();
    const container = this.scene.add.container(pos.x, pos.y + BUBBLE_OFFSET_Y);
    container.setDepth(100);

    // Text object (hidden initially if typewriter)
    const textObj = this.scene.add.text(0, 0, "", {
      fontSize: "11px",
      fontFamily: "sans-serif",
      color: request.type === "speech" ? "#2a2020" : "#4a4060",
      wordWrap: { width: BUBBLE_MAX_WIDTH - BUBBLE_PADDING * 2 },
      lineSpacing: 2,
    });
    textObj.setOrigin(0.5, 1);

    // Draw background (will be resized as text grows)
    const bg = this.scene.add.graphics();
    container.add(bg);
    container.add(textObj);

    const active: ActiveBubble = {
      agentId: request.agentId,
      type: request.type,
      container,
      textObj,
      fullText: request.text,
      revealIndex: 0,
    };

    this.activeBubbles.set(request.agentId, active);

    // Pop-in animation
    container.setScale(0);
    container.setAlpha(1);
    this.scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: POP_IN_DURATION,
      ease: "Back.easeOut",
      onComplete: () => {
        // Start typewriter after pop-in
        if (request.streaming !== false) {
          this.startTypewriter(active);
        } else {
          textObj.setText(request.text);
          this.resizeBubbleBackground(active);
        }
      },
    });

    // Schedule auto-dismiss
    const duration = request.duration ?? DEFAULT_DURATION;
    const typewriterTime = request.text.length * TYPEWRITER_SPEED;
    active.dismissTimer = this.scene.time.delayedCall(
      typewriterTime + duration,
      () => this.dismiss(request.agentId),
    );
  }

  private startTypewriter(active: ActiveBubble): void {
    active.revealTimer = this.scene.time.addEvent({
      delay: TYPEWRITER_SPEED,
      repeat: active.fullText.length - 1,
      callback: () => {
        active.revealIndex++;
        active.textObj.setText(active.fullText.substring(0, active.revealIndex));
        this.resizeBubbleBackground(active);
      },
    });
  }

  private resizeBubbleBackground(active: ActiveBubble): void {
    const bg = active.container.getAt(0) as Phaser.GameObjects.Graphics;
    bg.clear();

    const textBounds = active.textObj.getBounds();
    const w = Math.max(textBounds.width + BUBBLE_PADDING * 2, 40);
    const h = Math.max(textBounds.height + BUBBLE_PADDING * 2, 24);

    if (active.type === "speech") {
      this.drawSpeechBubble(bg, w, h);
    } else {
      this.drawThoughtBubble(bg, w, h);
    }

    // Reposition text centered in bubble
    active.textObj.setPosition(0, -POINTER_SIZE - BUBBLE_PADDING);
  }

  private drawSpeechBubble(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
    const x = -w / 2;
    const y = -h - POINTER_SIZE;
    const r = 8; // corner radius

    // Warm shadow
    g.fillStyle(0x3d2b1f, 0.06);
    g.fillRoundedRect(x + 2, y + 2, w, h, r);

    // Warm cream fill
    g.fillStyle(0xfff8f0, 0.92);
    g.fillRoundedRect(x, y, w, h, r);
    g.lineStyle(1, 0xd4c8b8, 1);
    g.strokeRoundedRect(x, y, w, h, r);

    // Triangular pointer
    g.fillStyle(0xfff8f0, 0.92);
    g.fillTriangle(
      -4, y + h,
      4, y + h,
      0, y + h + POINTER_SIZE,
    );
    g.lineStyle(1, 0xd4c8b8, 1);
    g.lineBetween(-4, y + h, 0, y + h + POINTER_SIZE);
    g.lineBetween(4, y + h, 0, y + h + POINTER_SIZE);
  }

  private drawThoughtBubble(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
    const x = -w / 2;
    const y = -h - POINTER_SIZE - 10;

    // Soft lavender fill
    g.fillStyle(0xf0eef8, 0.85);
    g.fillRoundedRect(x, y, w, h, 8);
    g.lineStyle(1.5, 0xa89ec0, 0.6);
    g.strokeRoundedRect(x, y, w, h, 8);

    // Trailing thought circles (3 small circles going down)
    g.fillStyle(0xf0eef8, 0.85);
    g.lineStyle(1, 0xa89ec0, 0.6);

    g.fillCircle(2, y + h + 5, 4);
    g.strokeCircle(2, y + h + 5, 4);

    g.fillCircle(0, y + h + 13, 3);
    g.strokeCircle(0, y + h + 13, 3);

    g.fillCircle(-1, y + h + 19, 2);
    g.strokeCircle(-1, y + h + 19, 2);
  }
}
