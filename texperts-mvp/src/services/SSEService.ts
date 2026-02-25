import { ServerMessage } from "@/types";

type MessageHandler = (message: ServerMessage) => void;

/**
 * SSE client — connects to /api/simulation/stream and dispatches events.
 */
export class SSEService {
  private eventSource: EventSource | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(): void {
    if (this.eventSource) this.disconnect();

    this.eventSource = new EventSource("/api/simulation/stream");

    this.eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;
        for (const handler of Array.from(this.handlers)) {
          handler(message);
        }
      } catch (e) {
        console.error("SSE parse error:", e);
      }
    };

    this.eventSource.onerror = () => {
      this.disconnect();
      // Auto-reconnect after 3 seconds
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    };
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  get isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

// Singleton
let instance: SSEService | null = null;

export function getSSEService(): SSEService {
  if (!instance) {
    instance = new SSEService();
  }
  return instance;
}
