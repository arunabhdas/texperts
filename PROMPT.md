# Claude Code Prompt: texperts.ai Prototype

> **IMPORTANT — BEFORE WRITING ANY CODE**: Enter **interview mode** first. Ask me clarifying questions about any ambiguity in this spec (priorities, scope cuts, API key availability, preferred art style, etc.). Once we've resolved open questions, enter **plan mode** and produce a detailed implementation plan with milestones, file-by-file breakdown, and dependency order. Only after I approve the plan should you begin implementation. Do NOT start coding until both the interview and plan phases are complete and I've given the go-ahead.

---

## 1. Project Vision

Build a web-based multi-agent simulation platform called **texperts.ai**. It is a 2D tile-based world (like the Stanford "Generative Agents" Smallville) where AI agents — powered by the Claude API — walk around a map, visit locations, encounter each other, form opinions, debate, collaborate, and sometimes oppose one another. Users watch the simulation unfold in real time and can intervene.

**Key inspiration**: [joonspk-research/generative_agents](https://github.com/joonspk-research/generative_agents) — 25 agents in a Phaser-rendered Smallville, backed by a Django server and LLM cognitive architecture (memory stream → perceive → reflect → plan → act). We are building a modernized, single-stack (TypeScript) version focused on **expert debate and prediction** rather than daily-life simulation.

**Core experience**: The user sees a top-down tile map (a stylized office/campus/think-tank). Agents walk between locations (conference room, whiteboard area, library, break room, individual offices). When agents encounter each other or arrive at a relevant location, they can initiate conversations visible as cartoon-style speech and thought bubbles floating above their sprites. The user can click agents, read their memory streams, inject prompts, and steer the simulation.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Game engine | **Phaser 3** (latest stable, v3.80+) | Tilemap rendering, sprite animation, camera controls, pathfinding |
| Tilemap editor | **Tiled** (export to JSON) | Orthogonal top-down map. We'll create a simple map programmatically if Tiled isn't available, or provide a pre-built JSON. |
| UI overlay | **React 18** (mounted alongside Phaser, not inside it) | Control panel, agent inspector, chat log. Communicates with Phaser scene via event bus. |
| Bundler | **Vite** | Fast HMR, good Phaser support |
| Backend | **Node.js + Express + ws** (WebSocket) | Orchestration, agent state, LLM calls |
| LLM | **Claude API** (`claude-sonnet-4-20250514`) via `@anthropic-ai/sdk` | Streaming responses. Each agent = separate system prompt + conversation. |
| Pathfinding | **EasyStar.js** | A* pathfinding on the tile grid. Agents compute paths to destinations and walk tile-by-tile. |
| Language | **TypeScript** throughout | Shared types between client and server |

---

## 3. The World: Tile-Based Environment

### 3.1 Map Design

The world is an orthogonal top-down tilemap called **"The Think Tank"** — a stylized office/campus environment. The map should be approximately **40×30 tiles** (each tile 32×32 pixels, so 1280×960 pixel world).

**Locations** (zones on the map, each composed of multiple tiles):

| Location | Purpose | Tiles |
|----------|---------|-------|
| **The Boardroom** | Central meeting space. Group debates happen here. | Large open area, center of map |
| **The Whiteboard Corner** | Brainstorming zone. Agents go here to think creatively. | Upper-left cluster |
| **The Library** | Research and reflection. Agents go here to retrieve memories / reflect. | Right side of map |
| **The Break Room** | Casual encounters. Unplanned conversations spark here. | Lower-left |
| **Office: Visionary** | The Visionary's private office. They go here to plan. | Individual room, top |
| **Office: Skeptic** | The Skeptic's private office. | Individual room |
| **Office: Builder** | The Builder's private office. | Individual room |
| **Office: Customer Whisperer** | The Customer Whisperer's private office. | Individual room |
| **Office: Devil's Advocate** | The Devil's Advocate's private office. | Individual room |
| **The Podium** | Presentation area. Agents go here to make formal statements. | Center-bottom |

### 3.2 Environment Tree (following Park et al.)

The world is represented as a **tree data structure** where edges indicate containment:

```
The Think Tank
├── The Boardroom
│   ├── conference_table
│   ├── projector_screen
│   └── chairs
├── The Whiteboard Corner
│   ├── whiteboard
│   └── markers
├── The Library
│   ├── bookshelves
│   ├── reading_desk
│   └── research_terminal
├── The Break Room
│   ├── coffee_machine
│   ├── snack_table
│   └── couch
├── Office: Visionary
│   ├── desk
│   └── vision_board
├── Office: Skeptic
│   ├── desk
│   └── spreadsheet_monitor
├── Office: Builder
│   ├── desk
│   └── code_terminal
├── Office: Customer Whisperer
│   ├── desk
│   └── customer_feedback_wall
├── Office: Devil's Advocate
│   ├── desk
│   └── devil_figurine
└── The Podium
    ├── lectern
    └── audience_seats
```

This tree is converted to natural language for the agents (e.g., "There is a whiteboard in the Whiteboard Corner"). Agents maintain **individual subgraphs** of this tree based on what they've visited/seen.

### 3.3 Collision & Walkability

- The tilemap has at least 2 layers: **ground** (always walkable) and **obstacles** (walls, furniture — not walkable).
- An optional **zones** layer (or object layer) defines named rectangular regions corresponding to the locations above.
- EasyStar.js reads the obstacle layer to build its pathfinding grid.
- Agents cannot walk through walls or furniture. They pathfind around obstacles.

### 3.4 Tile Art

For the prototype, use **simple colored tiles** generated programmatically (no external sprite sheets required):
- Floor tiles: light beige/gray
- Wall tiles: dark gray
- Furniture: colored rectangles (brown for desks, blue for screens, etc.)
- Zone highlights: semi-transparent colored overlays to show named areas

If time permits, use free tilesets (e.g., LimeZu's Modern Office tileset, which was used in the original generative agents project). But the prototype must work without any external art assets — generate everything in code.

---

## 4. Agent Sprites & Animation

### 4.1 Sprite Rendering

Each agent is rendered as a **sprite on the Phaser tilemap**:
- **Base**: A colored circle or simple character sprite (32×32 or 48×48 pixels). Each agent has a distinct color.
- **Name label**: Text rendered below the sprite (Phaser.GameObjects.Text).
- **Role label**: Smaller text below the name (e.g., "CEO" / "CFO").
- **Emoji/status indicator**: A small icon floating above the sprite showing current activity (💬 speaking, 🤔 thinking, 📝 planning, 😊 idle, ⚡ reacting).

For the prototype, generate simple circular sprites programmatically using Phaser's Graphics API — no sprite sheets needed. Color-code each agent distinctly.

### 4.2 Movement & Pathfinding

Agents move **tile-by-tile** using pathfinding:

1. The cognitive architecture decides the agent should go to a location (e.g., "go to The Boardroom").
2. The server resolves the location name to a target tile coordinate (any walkable tile within that zone).
3. EasyStar.js computes the A* path from the agent's current tile to the target tile.
4. The agent walks the path tile-by-tile, with a smooth tween between tiles (e.g., 200ms per tile).
5. While walking, the agent's sprite animates (if using sprite sheets) or simply moves smoothly.

**Movement speed**: configurable, default ~3 tiles/second.

**Collision between agents**: Agents can occupy the same tile (they're having a conversation). No agent-agent collision needed for the prototype.

### 4.3 Cartoon Bubbles

This is a signature visual feature. Bubbles float above agents on the Phaser canvas:

**Speech Bubble**:
- White rounded rectangle with a triangular pointer down toward the agent.
- Text inside, rendered with word-wrap at ~200px width.
- Appears with a pop-in animation (scale from 0 to 1 with elastic ease).
- For streaming: text appears token-by-token (typewriter effect).
- Shows the `summary` field (≤80 chars) by default. Full text available in the React inspector panel.
- Persists for a configurable duration (default 5 seconds), then fades out.
- If the agent addresses a specific other agent, draw a subtle dashed line from the bubble toward the target agent.

**Thought Bubble**:
- Cloud-shaped (or dotted-border rounded rect) with small trailing circles down to the agent (classic comic thought bubble).
- Used during the **reflect** and **plan** cognitive phases.
- Slightly transparent / lighter background to distinguish from speech.
- Shows what the agent is internally considering (other agents can't "see" this).

**Implementation**: Use Phaser's `Graphics` + `Text` game objects, grouped together and positioned relative to the agent sprite. Create a `BubbleManager` class that handles creation, positioning, animation, queueing (if multiple bubbles), and cleanup.

---

## 5. Cognitive Architecture (following Park et al.)

Each agent has a cognitive loop directly adapted from the generative agents paper. This is the core of the system.

### 5.1 Memory Stream

An append-only log of **observations**, **reflections**, and **plans**. Each entry:

```typescript
interface MemoryEntry {
  id: string;
  tick: number;                    // simulation tick when created
  timestamp: string;               // in-simulation time
  type: "observation" | "reflection" | "plan";
  content: string;                 // natural language description
  importance: number;              // 1-10, scored by LLM on creation
  embedding_keywords: string[];    // extracted keywords for retrieval
  associated_agent?: string;       // if this memory involves another agent
  location?: string;               // where this happened
  last_accessed: number;           // tick when last retrieved
}
```

**Importance scoring**: When a new memory is created, ask Claude: *"On a scale of 1 to 10, where 1 is mundane and 10 is critical, rate the importance of this memory: '{content}'. Respond with just the number."* (Use a fast, cheap call for this.)

**Retrieval**: When the agent needs memories for decision-making, retrieve the top-K most relevant entries using a weighted score:
```
score = α × recency + β × importance + γ × relevance
```
Where:
- **recency** = exponential decay based on ticks since creation
- **importance** = the 1-10 score, normalized
- **relevance** = keyword overlap between the current context and `embedding_keywords` (simple TF-IDF or Jaccard similarity — no embeddings needed for prototype)

Default weights: α=1.0, β=1.0, γ=1.0 (equal weighting). Retrieve top 10 memories.

### 5.2 Perceive → Reflect → Plan → Act Loop

Each simulation tick (configurable, default = 1 tick per 10 in-simulation seconds):

#### Perceive
- The agent receives events since the last tick: other agents' speech, location changes, user injections.
- Each perception becomes a new observation in the memory stream.
- The agent is aware of other agents **in their current location zone** (proximity-based awareness, just like the original paper).

#### Reflect (periodic)
- Triggered when the sum of importance scores of recent (un-reflected) observations exceeds a threshold (default: 15).
- The agent generates 2-3 high-level reflections by prompting Claude:
  *"Given these recent observations: {observations}. What are 3 high-level insights, patterns, or questions that arise? Be specific to the ongoing discussion and your role as {persona}."*
- Reflections are added to the memory stream as type "reflection" and are available for future retrieval.

#### Plan
- Each agent maintains a **current plan** — a high-level intention (e.g., "Go to the Boardroom and challenge The Visionary's revenue projections").
- Plans decompose into sub-actions:
  1. **Move to location** (triggers pathfinding)
  2. **Interact with object** (e.g., "review data at research_terminal")
  3. **Initiate conversation** with an agent in the same location
  4. **Speak in ongoing conversation**
  5. **Wait / observe**
- Plans are re-evaluated when significant new perceptions arrive (e.g., another agent says something provocative).
- Planning prompt to Claude:
  *"You are {name}, {persona}. Your current plan: {plan}. Recent memories: {retrieved_memories}. Current location: {location}. Agents nearby: {nearby_agents}. Current conversation (if any): {conversation}. What do you do next? Choose an action: move_to(location), speak(target, message), think(reflection), wait(). Explain your reasoning briefly, then state your action."*

#### Act
- The agent executes the chosen action:
  - **move_to**: Server computes path, sends movement commands to Phaser client.
  - **speak**: Generates speech via Claude, structured as `AgentAction` (see below). Server broadcasts to all agents in the same location as a new perception. Client renders speech bubble.
  - **think**: Generates internal thought. Only visible as a thought bubble on the client. Not perceived by other agents.
  - **wait**: Agent idles. Can still perceive.

### 5.3 Agent Action Schema (Structured Output)

Every agent speech/action produces structured JSON. Use Claude's **tool_use** to enforce this:

```typescript
interface AgentAction {
  agent_id: string;
  tick: number;
  action_type: "move_to" | "speak" | "think" | "react" | "wait";

  // For move_to:
  destination?: string;            // location name from the environment tree

  // For speak/think/react:
  target?: string;                 // agent_id, "all", or "self" (for think)
  content?: string;                // full text
  summary?: string;                // ≤80 char summary for bubble display
  emotion?: "confident" | "uncertain" | "skeptical" | "excited" | "alarmed" | "neutral" | "amused";
  agreement_score?: number;        // -1.0 to 1.0 (with prior speaker)
  confidence?: number;             // 0.0 to 1.0

  // Meta:
  reasoning?: string;              // brief internal reasoning (shown in thought bubble or inspector)
}
```

Define a Claude tool called `agent_action` with this schema. Instruct agents to always use this tool.

### 5.4 Conversations

When two or more agents are in the same location and one initiates speech:
- A **conversation object** is created on the server, tracking participants and turns.
- Each agent in the location perceives the speech and can respond on their next turn.
- Conversations end when agents leave the location or the orchestrator decides the topic is exhausted.
- Conversations are logged and replayable.

**Conversation initiation** (following the original paper): When Agent A enters a location where Agent B is present, the orchestrator prompts Agent A: *"You see {Agent B name} ({Agent B role}) at {location}. Given your current plan and memories, do you want to initiate a conversation? If so, what do you say?"*

---

## 6. Orchestrator

The orchestrator is a **server-side rule engine** (NOT an LLM agent) that controls the simulation loop.

### 6.1 Simulation Loop

```
while simulation_running:
    tick += 1
    for each agent (in priority order):
        1. Deliver new perceptions to agent
        2. Check if reflection is triggered
        3. Ask agent to plan/act (LLM call)
        4. Execute the action (move, speak, etc.)
        5. Broadcast results as perceptions to other nearby agents
    update spatial state (who is where)
    send state snapshot to frontend via WebSocket
    wait for tick_interval (adjustable speed)
```

### 6.2 Turn Order
- Default: round-robin through all agents.
- **Priority boost**: Agents who were just addressed get priority (respond before others).
- **Fairness**: Agents who haven't acted recently get a small priority boost.

### 6.3 Phases (optional, user-configurable)

The simulation can optionally proceed through structured phases:

1. **Setup** (30s): Agents read the scenario briefing, go to their offices, form initial thoughts.
2. **Gather** (auto): Agents decide to move to the Boardroom (or the orchestrator nudges them).
3. **Open Discussion**: Free-form debate. No time limit — user controls when to advance.
4. **Breakout**: Agents may split into sub-groups at different locations (Whiteboard, Library).
5. **Reconvene**: Agents return to Boardroom to share findings.
6. **Decision**: Final statements and vote.

Phases are optional and can be disabled for free-form simulation.

---

## 7. Frontend Architecture

### 7.1 Phaser ↔ React Integration

Phaser handles the game world (tilemap, sprites, bubbles, camera). React handles the UI overlay (control panel, inspector, chat log). They communicate via a shared **event bus** (simple EventEmitter or Zustand store).

```
┌─────────────────────────────────────────────┐
│  Browser Window                              │
│  ┌─────────────────────────────────────────┐ │
│  │  Phaser Canvas (game world)             │ │
│  │  - Tilemap rendering                    │ │
│  │  - Agent sprites + movement             │ │
│  │  - Speech/thought bubbles               │ │
│  │  - Camera controls (arrow keys, drag)   │ │
│  │  - Click detection on agents            │ │
│  └─────────────────────────────────────────┘ │
│  ┌───────────┐ ┌────────────────────────────┐│
│  │ Control   │ │ Agent Inspector Panel      ││
│  │ Panel     │ │ (shows on agent click)     ││
│  │ (React)   │ │ - Memory stream            ││
│  │ - Play    │ │ - Current plan             ││
│  │ - Pause   │ │ - Relationships            ││
│  │ - Speed   │ │ - Full conversation log    ││
│  │ - Inject  │ │ (React)                    ││
│  └───────────┘ └────────────────────────────┘│
│  ┌─────────────────────────────────────────┐ │
│  │  Event Log / Chat Timeline (React)      │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 7.2 Phaser Scene Structure

```typescript
// MainScene.ts — the primary Phaser scene
class MainScene extends Phaser.Scene {
  private map: Phaser.Tilemaps.Tilemap;
  private groundLayer: Phaser.Tilemaps.TilemapLayer;
  private obstacleLayer: Phaser.Tilemaps.TilemapLayer;
  private agents: Map<string, AgentSprite>;   // AgentSprite wraps Phaser sprite + bubble
  private pathfinder: EasyStar.js;
  private bubbleManager: BubbleManager;
  private zoneOverlays: Map<string, Phaser.GameObjects.Rectangle>;

  preload() { /* load tilemap JSON, tilesets, or generate textures */ }
  create() { /* build map, spawn agents, init pathfinding, set up camera */ }
  update() { /* animate agents along paths, update bubble positions */ }
}
```

### 7.3 Camera Controls
- Arrow keys or WASD to pan.
- Mouse wheel to zoom.
- Click-drag to pan.
- Click on an agent to select (emits event to React for inspector panel).
- Minimap in corner (optional, stretch goal).

---

## 8. Server Architecture

### 8.1 Express + WebSocket

```typescript
// server/src/index.ts
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// REST endpoints:
// POST /api/simulation/start    — start a new simulation with scenario config
// POST /api/simulation/pause    — pause
// POST /api/simulation/resume   — resume
// POST /api/simulation/step     — advance one tick
// POST /api/simulation/inject   — inject a user prompt
// GET  /api/agents              — list all agents + current state
// GET  /api/agents/:id/memory   — get an agent's memory stream
// GET  /api/events              — get event log

// WebSocket: streams real-time updates to all connected clients
// Messages follow the protocol defined in section 9.
```

### 8.2 Project Structure

```
texperts-ai/
├── client/
│   ├── src/
│   │   ├── main.tsx                    # React entry point, mounts Phaser + React
│   │   ├── App.tsx                     # React root, layout
│   │   ├── phaser/
│   │   │   ├── config.ts              # Phaser game config
│   │   │   ├── scenes/
│   │   │   │   ├── MainScene.ts       # Primary game scene
│   │   │   │   ├── BootScene.ts       # Asset loading scene
│   │   │   │   └── UIScene.ts         # Optional: HUD scene overlaying MainScene
│   │   │   ├── entities/
│   │   │   │   ├── AgentSprite.ts     # Agent game object (sprite + label + status)
│   │   │   │   └── BubbleManager.ts   # Manages speech/thought bubbles
│   │   │   ├── map/
│   │   │   │   ├── MapGenerator.ts    # Procedurally generates tilemap if no JSON
│   │   │   │   └── ZoneManager.ts     # Manages named zones on the map
│   │   │   └── pathfinding/
│   │   │       └── PathfindingService.ts  # EasyStar.js wrapper
│   │   ├── ui/                         # React components
│   │   │   ├── ControlPanel.tsx
│   │   │   ├── AgentInspector.tsx
│   │   │   ├── EventLog.tsx
│   │   │   ├── PromptInjector.tsx
│   │   │   └── ScenarioSetup.tsx
│   │   ├── store/
│   │   │   └── useSimulationStore.ts   # Zustand store
│   │   ├── services/
│   │   │   ├── WebSocketService.ts     # WebSocket client
│   │   │   └── EventBus.ts            # Phaser ↔ React communication
│   │   └── types/
│   │       └── index.ts
│   ├── public/
│   │   └── assets/                     # Tilesets, sprites if using external art
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── server/
│   ├── src/
│   │   ├── index.ts                    # Express + WebSocket entry
│   │   ├── orchestrator/
│   │   │   ├── Orchestrator.ts         # Main simulation loop + turn management
│   │   │   ├── PhaseManager.ts         # Optional phase progression
│   │   │   └── ConversationManager.ts  # Tracks active conversations
│   │   ├── agents/
│   │   │   ├── Agent.ts                # Core agent class (state, persona, goals)
│   │   │   ├── CognitiveLoop.ts        # Perceive → Reflect → Plan → Act
│   │   │   ├── MemoryStream.ts         # Append-only memory with retrieval
│   │   │   ├── ReflectionEngine.ts     # Periodic higher-level synthesis
│   │   │   └── Planner.ts             # Plan generation + decomposition
│   │   ├── world/
│   │   │   ├── EnvironmentTree.ts      # Tree representation of the world
│   │   │   ├── SpatialState.ts         # Who is where (tile coords + zone)
│   │   │   └── ZoneRegistry.ts         # Maps zone names → tile coordinates
│   │   ├── llm/
│   │   │   ├── ClaudeClient.ts         # Anthropic SDK wrapper, streaming
│   │   │   └── PromptTemplates.ts      # System prompts for each cognitive phase
│   │   ├── simulation/
│   │   │   ├── EventLog.ts             # Append-only event log for replay
│   │   │   ├── SimulationState.ts      # Canonical snapshot of everything
│   │   │   └── ScenarioLoader.ts       # Load predefined scenarios
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── shared/
│   └── types.ts                        # Types shared between client and server
├── package.json                        # Workspace root (npm workspaces)
├── tsconfig.base.json
└── README.md
```

---

## 9. WebSocket Protocol

```typescript
// === Server → Client ===

type ServerMessage =
  // Agent moved to a new tile (client animates along path)
  | { type: "agent_move"; payload: { agent_id: string; path: Array<{x: number; y: number}>; speed: number } }

  // Agent started thinking (show thought indicator on sprite)
  | { type: "agent_thinking"; payload: { agent_id: string } }

  // Streaming token for a speech/thought bubble
  | { type: "agent_stream_token"; payload: { agent_id: string; token: string; bubble_type: "speech" | "thought" } }

  // Stream complete — full structured action available
  | { type: "agent_action_complete"; payload: AgentAction }

  // A new perception was delivered to an agent (for event log display)
  | { type: "perception"; payload: { agent_id: string; content: string; source: string } }

  // Reflection generated
  | { type: "reflection"; payload: { agent_id: string; reflections: string[] } }

  // Phase changed
  | { type: "phase_change"; payload: { phase: string; description: string } }

  // Full state sync (sent on connect and periodically)
  | { type: "state_sync"; payload: SimulationState }

  // Tick heartbeat
  | { type: "tick"; payload: { tick: number; simulation_time: string } }


// === Client → Server ===

type ClientMessage =
  | { type: "control"; payload: { action: "play" | "pause" | "step" | "reset" } }
  | { type: "set_speed"; payload: { speed: number } }  // 0.5, 1, 2, 4
  | { type: "inject_prompt"; payload: { text: string; target?: string; as_inner_voice?: boolean } }
  | { type: "add_agent"; payload: { name: string; role: string; persona: string; color: string } }
  | { type: "remove_agent"; payload: { agent_id: string } }
  | { type: "request_agent_memory"; payload: { agent_id: string } }
  | { type: "nudge_agent"; payload: { agent_id: string; destination: string } }  // tell agent to go somewhere
```

---

## 10. Demo Scenario

**Scenario: "Should our startup pivot from B2B to B2C?"**

### Agents

| Agent | Color | Role | Disposition | Starting Location | Seed Persona |
|-------|-------|------|-------------|-------------------|-------------|
| **The Visionary** | 🟢 Green | CEO | Collaborative | Office: Visionary | You are The Visionary, a startup CEO who thinks in terms of market opportunity and bold moves. You're excited about the B2C pivot because you see a massive TAM of 50M consumers. You tend to inspire others but sometimes overlook execution details. You believe in moving fast and iterating. |
| **The Skeptic** | 🔴 Red | CFO | Adversarial | Office: Skeptic | You are The Skeptic, a cautious CFO who demands evidence before any major decision. You're concerned about the B2C pivot because consumer acquisition costs are 5-10x higher than enterprise, the burn rate would triple, and the company has zero consumer brand recognition. You challenge assumptions relentlessly but fairly. You respect data above all. |
| **The Builder** | 🔵 Blue | CTO | Neutral | Office: Builder | You are The Builder, a pragmatic CTO who thinks about what's technically feasible and what the team of 12 engineers can actually ship in 6 months. You have concerns about rebuilding the product for consumer UX, but you also see technical advantages in the pivot. You're honest about timelines. |
| **The Customer Whisperer** | 🟡 Yellow | Head of Product | Collaborative | Office: Customer Whisperer | You are The Customer Whisperer, head of product who deeply understands user needs through 200+ customer interviews. You have data showing that 40% of B2B users actually came through word-of-mouth from individual users who loved the product. This makes you believe a B2C play has organic potential. You think about product-market fit above all. |
| **Devil's Advocate** | 🟣 Purple | Board Advisor | Adversarial | Office: Devil's Advocate | You are the Devil's Advocate, a board advisor whose explicit role is to challenge every argument, find weaknesses, and prevent groupthink. You don't have a personal position on the pivot — your job is to stress-test whatever the current consensus is. If everyone agrees, you disagree. If everyone disagrees, you find the case for agreement. You ask uncomfortable questions. |

### Scenario Briefing (injected as initial perception for all agents)

> "The board has asked the leadership team to evaluate whether the company should pivot from its current B2B SaaS model to a B2C consumer product. The B2B business is generating $2M ARR with 15% month-over-month growth, but the team believes the consumer market opportunity is 100x larger. The company has $5M in runway. The board wants a recommendation by end of week. Each team member should evaluate this from their area of expertise and discuss."

### Expected Emergent Behavior

After several ticks, agents should:
1. Read the briefing in their offices (initial planning).
2. Start moving toward The Boardroom (drawn by the importance of the topic).
3. The Visionary arrives first and makes an opening statement.
4. Other agents arrive and respond based on their personas.
5. The Skeptic challenges the Visionary's optimism with financial concerns.
6. The Customer Whisperer shares user data supporting organic growth potential.
7. The Builder raises technical feasibility questions.
8. The Devil's Advocate pokes holes in whatever the emerging consensus is.
9. Some agents may break off to the Whiteboard or Library to think/research.
10. They reconvene and approach a conclusion (or productive disagreement).

---

## 11. Prompt Engineering

### System Prompt Template (per agent)

```
You are {agent_name}, {agent_role} at a startup.

## Your Persona
{detailed_persona_seed}

## Your Cognitive State
Current plan: {current_plan_or_none}
Key memories (most relevant to current context):
{top_10_retrieved_memories_formatted}

Recent reflections:
{recent_reflections_or_none}

## The World
You are currently at: {current_location}
Nearby agents: {agents_in_same_zone}
Available locations: {list_of_all_locations_with_descriptions}

## Current Conversation (if any)
{last_5_conversation_turns_or_no_active_conversation}

## What Just Happened
{new_perceptions_since_last_turn}

## Instructions
Decide your next action. Use the `agent_action` tool to respond. Your options:
- move_to(destination): Walk to a location. Pick from the available locations list.
- speak(target, message): Say something. Target a specific agent or "all".
- think(reflection): Think to yourself. This is private — no one else sees it.
- react(target, emoji): Quick emotional reaction to something.
- wait(): Do nothing this turn. Observe.

Guidelines:
- Stay in character as {agent_name} at all times.
- Be concise: speeches should be 1-3 sentences. Thoughts should be 1 sentence.
- Take specific positions with concrete details (numbers, examples).
- Reference things other agents have said when responding.
- Your summary field should be ≤80 characters — a punchy one-liner version of your content.
- If you're moving to a location, briefly explain why in your reasoning field.
```

### Importance Scoring Prompt (lightweight)

```
On a scale of 1 to 10, where 1 is completely mundane (e.g., "The Visionary walked to the break room") and 10 is extremely critical (e.g., "The Skeptic revealed the company only has 3 months of runway, not 5"), rate the importance of this memory:

"{memory_content}"

Respond with ONLY a single integer from 1 to 10.
```

### Reflection Prompt

```
You are {agent_name}. Here are your most recent observations:
{numbered_list_of_recent_observations}

Based on these observations, generate exactly 3 high-level insights or questions. These should be:
- Synthetic (combine multiple observations into a higher-level understanding)
- Relevant to the B2B-to-B2C pivot discussion
- Grounded in your role as {agent_role}

Format each as a single sentence. Respond with a JSON array of 3 strings.
```

---

## 12. Implementation Priorities (Build Order for Claude Code)

### Milestone 1: The World (get tiles on screen)
- [ ] Set up Vite + Phaser 3 + React project structure with TypeScript
- [ ] Create or load a tilemap (procedural generation preferred — no external assets)
- [ ] Render ground layer, obstacle layer, zone overlays with labels
- [ ] Implement camera controls (pan, zoom)
- [ ] This milestone is done when you can see the Think Tank map in a browser and navigate around it

### Milestone 2: Agents on the Map
- [ ] Generate simple agent sprites (colored circles) programmatically
- [ ] Place 5 agents at their starting locations
- [ ] Implement EasyStar.js pathfinding on the obstacle grid
- [ ] Implement agent movement (click a destination, agent walks there tile-by-tile with tween)
- [ ] Add name + role labels below each agent
- [ ] Add idle bobbing animation
- [ ] This milestone is done when 5 labeled agents stand on the map and can pathfind to destinations

### Milestone 3: Bubbles
- [ ] Implement speech bubble rendering (white rect, pointer, text, pop-in animation)
- [ ] Implement thought bubble rendering (cloud shape, dotted, trailing circles)
- [ ] Implement typewriter text effect (simulate streaming)
- [ ] Implement bubble queue (one bubble at a time per agent, queue if needed)
- [ ] Implement auto-dismiss after timeout
- [ ] Test with mock data (hardcoded agent speeches)
- [ ] This milestone is done when clicking an agent shows test speech and thought bubbles with animation

### Milestone 4: Backend + Orchestrator (no LLM yet)
- [ ] Set up Express + WebSocket server
- [ ] Implement SimulationState, EventLog, EnvironmentTree
- [ ] Implement Orchestrator with tick loop and round-robin turn management
- [ ] Implement Agent class with MemoryStream (without LLM — use mock responses)
- [ ] Wire up WebSocket: server sends movement and mock speech events, client renders them
- [ ] This milestone is done when agents move around the map and show mock speeches driven by the server

### Milestone 5: Claude Integration
- [ ] Implement ClaudeClient with streaming via Anthropic SDK
- [ ] Implement PromptTemplates (system prompts, importance scoring, reflection)
- [ ] Wire up Agent → CognitiveLoop → ClaudeClient pipeline
- [ ] Implement structured output via tool_use for AgentAction
- [ ] Test with a single agent: inject scenario → agent plans → acts → speaks
- [ ] Scale to all 5 agents with turn management
- [ ] This milestone is done when 5 agents autonomously discuss the B2B→B2C pivot with real Claude calls

### Milestone 6: Full Cognitive Loop
- [ ] Implement memory retrieval (recency + importance + relevance scoring)
- [ ] Implement periodic reflection generation
- [ ] Implement plan generation and decomposition (move_to + speak sequences)
- [ ] Implement perception delivery (agents perceive speech from agents in same zone)
- [ ] Implement conversation management (start, turn-taking, end)
- [ ] This milestone is done when agents demonstrate memory, reflection, and planning in their behavior

### Milestone 7: User Interaction (React UI)
- [ ] Implement ControlPanel (play/pause/step/speed slider)
- [ ] Implement AgentInspector (click agent → side panel with memory, plan, relationships)
- [ ] Implement EventLog (scrollable timeline of all events)
- [ ] Implement PromptInjector (text input → inject as moderator or inner voice)
- [ ] Wire up Phaser ↔ React via event bus
- [ ] This milestone is done when users can fully control and inspect the simulation

### Milestone 8: Polish
- [ ] Reaction emotes (pop-up animated emoji above agents)
- [ ] Connection lines between speaking agents (colored by agreement)
- [ ] Status indicators on agent sprites (emoji showing current activity)
- [ ] Smooth sprite following for camera (click agent → camera follows)
- [ ] Minimap (stretch goal)
- [ ] Scenario setup screen (configure agents + scenario before starting)
- [ ] Export simulation log as JSON

---

## 13. Key Implementation Notes

### Claude API Usage
- Use `claude-sonnet-4-20250514` for all agent cognition calls.
- Use **streaming** (`stream: true`) for speech generation — tokens stream to client via WebSocket for typewriter bubble effect.
- Use a **non-streaming** fast call for importance scoring (single integer response).
- Each agent maintains a separate conversation thread on the server.
- **Rate limiting**: With 5 agents, expect ~5-15 API calls per tick (planning + speech + importance scoring). Add configurable delay between agents. Default: 500ms between agent turns. Sequential, not parallel, for the prototype.
- **Cost control**: Each agent's context should stay under ~4K tokens by summarizing older memories rather than including the full stream.

### Pathfinding Notes
- EasyStar.js operates asynchronously. Configure it in synchronous mode for simplicity, or handle the async callback to trigger movement.
- The server decides WHERE the agent should go (location name → tile coordinate). The client handles HOW (pathfinding + animation).
- Server sends `agent_move` with the target tile. Client computes the path via EasyStar and animates.

### Phaser + React Co-existence
- Mount Phaser in a `<div id="phaser-game">` and React in a sibling `<div id="react-ui">`.
- The React UI overlays the Phaser canvas using CSS `position: absolute` with `pointer-events: none` on the overlay (and `pointer-events: auto` on interactive React elements).
- Communication via a shared Zustand store or EventEmitter singleton.

### Programmatic Tilemap Generation
Since we may not have Tiled available, implement a `MapGenerator` that:
1. Creates a 2D array representing the tile grid.
2. Fills the grid with floor tiles.
3. Draws walls around the perimeter and between rooms.
4. Places furniture tiles in rooms.
5. Defines zone rectangles.
6. Outputs a Phaser-compatible tilemap via `Phaser.Tilemaps.MapData` or creates it directly using `createBlankLayer` + `putTileAt`.

---

## 14. Quick Start

```bash
# Clone and install
cd texperts-ai
npm install       # installs root + workspace deps

# Set API key
export ANTHROPIC_API_KEY="sk-ant-..."

# Start backend (port 3001)
cd server && npm run dev

# Start frontend (port 5173) — separate terminal
cd client && npm run dev

# Open http://localhost:5173
```

---

## 15. Definition of "Done"

A successful prototype demonstrates ALL of the following:

1. ✅ A tile-based 2D map ("The Think Tank") rendered in Phaser with distinct labeled zones
2. ✅ 5 agent sprites on the map with names, roles, and distinct colors
3. ✅ Agents pathfind and walk tile-by-tile between locations (smooth tweened movement)
4. ✅ Speech bubbles appear above agents with streaming typewriter text from Claude API
5. ✅ Thought bubbles appear during reflection/planning phases (distinct visual style)
6. ✅ Agents perceive each other when in the same zone and engage in conversation
7. ✅ The cognitive loop is visible: agents think → move to locations → speak → react → reflect
8. ✅ Memory stream is working: agents reference past statements and build on them
9. ✅ The orchestrator manages multi-agent turn-taking across multiple rounds
10. ✅ Users can play/pause/step the simulation and adjust speed
11. ✅ Users can click an agent to inspect their memory, plan, and conversation history
12. ✅ Users can inject prompts (as moderator or inner voice) to steer the simulation
13. ✅ The demo scenario runs end-to-end with emergent, coherent multi-agent debate
14. ✅ The experience feels *alive* — agents move purposefully, speak meaningfully, and the user can follow the narrative

---

> **Reminder**: Start with the **interview** (ask me clarifying questions), then produce a **plan** (milestones with file-by-file breakdown), then implement after my approval.
