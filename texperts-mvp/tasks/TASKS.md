# texperts.ai — Task Breakdown

All 8 milestones decomposed into Epics > Stories > Tasks.
Status: [ ] pending | [~] in progress | [x] done

---

## Epic 1: The World (Milestone 1)
> Get tiles on screen. Browser shows a 40x30 tile map with labeled zones, camera pan/zoom works.

### Story 1.1: Project Initialization
- [ ] 1.1.1 Initialize Next.js 14 project with TypeScript, App Router
- [ ] 1.1.2 Install dependencies (phaser, easystarjs, zustand, @anthropic-ai/sdk)
- [ ] 1.1.3 Configure Tailwind CSS
- [ ] 1.1.4 Configure next.config.js (Phaser compatibility: disable SSR for game components)
- [ ] 1.1.5 Create .env.local.example with ANTHROPIC_API_KEY placeholder

### Story 1.2: Core Type Definitions
- [ ] 1.2.1 Define map/tile types (TileType, ZoneDefinition, MapData)
- [ ] 1.2.2 Define agent types (AgentConfig, AgentState, AgentAction)
- [ ] 1.2.3 Define simulation types (SimulationState, MemoryEntry)
- [ ] 1.2.4 Define protocol types (ServerMessage, ClientMessage — SSE variants)

### Story 1.3: Phaser Integration
- [ ] 1.3.1 Create GameCanvas.tsx (client-only component, mounts Phaser)
- [ ] 1.3.2 Create Phaser config.ts (game dimensions, scene list, render settings)
- [ ] 1.3.3 Create BootScene.ts (programmatic texture generation: floor, wall, furniture tiles)
- [ ] 1.3.4 Wire GameCanvas into app/page.tsx

### Story 1.4: Procedural Map Generation
- [ ] 1.4.1 Implement MapGenerator.ts — create 40x30 grid with floor tiles
- [ ] 1.4.2 Add perimeter walls
- [ ] 1.4.3 Add interior walls to define rooms (Boardroom, Library, Break Room, offices, etc.)
- [ ] 1.4.4 Add doorways/openings between rooms and hallways
- [ ] 1.4.5 Add furniture tiles (desks, tables, bookshelves, etc.)
- [ ] 1.4.6 Define walkability grid (floor = walkable, wall/furniture = blocked)

### Story 1.5: Zone Management
- [ ] 1.5.1 Implement ZoneManager.ts — define named rectangular zones
- [ ] 1.5.2 Map each zone to its tile coordinates (Boardroom, Library, offices, etc.)
- [ ] 1.5.3 Render semi-transparent colored overlays per zone
- [ ] 1.5.4 Render zone name labels on the map

### Story 1.6: Main Scene + Camera
- [ ] 1.6.1 Implement MainScene.ts — load map from MapGenerator, render ground + obstacle layers
- [ ] 1.6.2 Implement camera pan (WASD / arrow keys)
- [ ] 1.6.3 Implement camera zoom (mouse wheel)
- [ ] 1.6.4 Implement camera drag (click-drag to pan)
- [ ] 1.6.5 Set camera bounds to map dimensions

### Story 1.7: Layout
- [ ] 1.7.1 Create app/layout.tsx with basic styling
- [ ] 1.7.2 Create app/page.tsx with GameCanvas + placeholder UI panels
- [ ] 1.7.3 Style with Tailwind: dark theme, game canvas centered, side panels

**Gate**: `npm run dev` → browser shows The Think Tank map with labeled zones, camera controls work.

---

## Epic 2: Agents on the Map (Milestone 2)
> 5 labeled agents on the map, pathfinding to destinations.

### Story 2.1: Agent Sprites
- [ ] 2.1.1 Implement AgentSprite.ts — colored circle (32px) with distinct color per agent
- [ ] 2.1.2 Add name label below sprite (Phaser.GameObjects.Text)
- [ ] 2.1.3 Add role label below name (smaller text)
- [ ] 2.1.4 Add idle bobbing animation (subtle up-down tween)
- [ ] 2.1.5 Add status emoji indicator above sprite (placeholder)

### Story 2.2: Pathfinding
- [ ] 2.2.1 Implement PathfindingService.ts — EasyStar.js wrapper
- [ ] 2.2.2 Initialize grid from MapGenerator's walkability data
- [ ] 2.2.3 Implement findPath(startTile, endTile) → Promise<Path>
- [ ] 2.2.4 Implement agent movement along path (tile-by-tile tween, ~200ms/tile)

### Story 2.3: Agent Spawning & Interaction
- [ ] 2.3.1 Define 5 agent configs (Visionary/green, Skeptic/red, Builder/blue, Whisperer/yellow, Devil's Advocate/purple)
- [ ] 2.3.2 Spawn agents at their starting office locations
- [ ] 2.3.3 Implement click-to-select agent (highlight selected)
- [ ] 2.3.4 Implement right-click destination → pathfind + walk (debug mode)

### Story 2.4: Event Bus
- [ ] 2.4.1 Implement EventBus.ts (typed EventEmitter singleton)
- [ ] 2.4.2 Emit 'agent-selected' on agent click (for React inspector)
- [ ] 2.4.3 Emit 'agent-moved' when agent reaches destination

**Gate**: 5 labeled agents visible at starting positions, click destination → smooth pathfind walk.

---

## Epic 3: Bubbles (Milestone 3)
> Speech and thought bubbles with typewriter text effect.

### Story 3.1: Speech Bubbles
- [ ] 3.1.1 Implement BubbleManager.ts — manages all bubbles for all agents
- [ ] 3.1.2 Create speech bubble: white rounded rect + triangular pointer
- [ ] 3.1.3 Add word-wrap text inside bubble (~200px width)
- [ ] 3.1.4 Pop-in animation (scale 0→1 with elastic ease)
- [ ] 3.1.5 Auto-dismiss after configurable timeout (default 5s), fade-out

### Story 3.2: Thought Bubbles
- [ ] 3.2.1 Create thought bubble: dotted-border rounded rect
- [ ] 3.2.2 Add trailing small circles (classic comic thought indicator)
- [ ] 3.2.3 Lighter/transparent background to distinguish from speech
- [ ] 3.2.4 Same pop-in and dismiss behavior as speech bubbles

### Story 3.3: Typewriter Effect
- [ ] 3.3.1 Implement character-by-character text reveal (configurable speed)
- [ ] 3.3.2 Support streaming mode (append tokens as they arrive)
- [ ] 3.3.3 Auto-resize bubble as text grows

### Story 3.4: Bubble Queue & Positioning
- [ ] 3.4.1 One active bubble per agent at a time, queue if needed
- [ ] 3.4.2 Position bubble above agent sprite, follow agent during movement
- [ ] 3.4.3 Prevent bubble overlap between nearby agents (offset if needed)

### Story 3.5: Test Integration
- [ ] 3.5.1 Click agent → show test speech bubble with mock text
- [ ] 3.5.2 Double-click agent → show test thought bubble
- [ ] 3.5.3 Verify animations, positioning, and cleanup

**Gate**: Click agent → animated speech bubble with typewriter text. Thought bubbles visually distinct.

---

## Epic 4: Backend + Orchestrator — Mock LLM (Milestone 4)
> Server simulation loop with mock responses, SSE streaming to client.

### Story 4.1: World State (Server-Side)
- [ ] 4.1.1 Implement EnvironmentTree.ts — tree structure of locations + objects
- [ ] 4.1.2 Implement ZoneRegistry.ts — map zone names → tile coordinates
- [ ] 4.1.3 Implement SpatialState.ts — track which agent is at which tile/zone

### Story 4.2: Agent Engine (No LLM)
- [ ] 4.2.1 Implement Agent.ts — state, persona, current plan, location
- [ ] 4.2.2 Implement MemoryStream.ts — append-only log, basic add/list
- [ ] 4.2.3 Implement EventLog.ts — simulation-wide event log
- [ ] 4.2.4 Implement SimulationState.ts — canonical snapshot of all state

### Story 4.3: Orchestrator
- [ ] 4.3.1 Implement Orchestrator.ts — tick loop, round-robin turn management
- [ ] 4.3.2 Implement mock action generation (agents randomly move + say scripted lines)
- [ ] 4.3.3 Implement turn priority (agents who were addressed get priority)
- [ ] 4.3.4 Implement tick timing (configurable speed)

### Story 4.4: SSE API Endpoints
- [ ] 4.4.1 Implement /api/simulation/start — init simulation, return state
- [ ] 4.4.2 Implement /api/simulation/stream — SSE endpoint, streams tick events
- [ ] 4.4.3 Implement /api/simulation/pause — pause tick loop
- [ ] 4.4.4 Implement /api/simulation/resume — resume tick loop
- [ ] 4.4.5 Implement /api/simulation/step — advance exactly one tick
- [ ] 4.4.6 Implement /api/simulation/state — return current state snapshot

### Story 4.5: Client Integration
- [ ] 4.5.1 Implement SSEService.ts — EventSource wrapper, reconnection, event parsing
- [ ] 4.5.2 Implement useSimulationStore.ts — Zustand store for simulation state
- [ ] 4.5.3 Wire SSE events → Zustand → EventBus → Phaser scene
- [ ] 4.5.4 Phaser responds to agent_move events (pathfind + animate)
- [ ] 4.5.5 Phaser responds to agent_action_complete events (show bubble)

**Gate**: Start simulation → agents autonomously move around map + show mock speeches via SSE.

---

## Epic 5: Claude Integration (Milestone 5)
> Real LLM calls, structured output, streaming speech bubbles.

### Story 5.1: Claude Client
- [ ] 5.1.1 Implement ClaudeClient.ts — Anthropic SDK wrapper
- [ ] 5.1.2 Implement streaming mode (stream: true, token-by-token)
- [ ] 5.1.3 Implement tool_use for structured AgentAction output
- [ ] 5.1.4 Implement non-streaming mode for importance scoring (fast, single integer)
- [ ] 5.1.5 Add API key resolution (user-provided header → env var fallback)
- [ ] 5.1.6 Add rate limiting (500ms between agent calls)

### Story 5.2: Prompt Templates
- [ ] 5.2.1 Implement system prompt template (per-agent, with persona + state + world)
- [ ] 5.2.2 Implement importance scoring prompt (1-10 scale)
- [ ] 5.2.3 Implement reflection generation prompt (3 insights)
- [ ] 5.2.4 Implement agent_action tool definition (structured output schema)

### Story 5.3: Cognitive Loop (Basic)
- [ ] 5.3.1 Implement CognitiveLoop.ts — perceive → plan → act pipeline
- [ ] 5.3.2 Wire Agent → CognitiveLoop → ClaudeClient
- [ ] 5.3.3 Implement Planner.ts — ask Claude for next action
- [ ] 5.3.4 Parse structured AgentAction from tool_use response

### Story 5.4: Integration
- [ ] 5.4.1 Replace mock actions in Orchestrator with CognitiveLoop calls
- [ ] 5.4.2 Stream Claude tokens through SSE → client typewriter bubbles
- [ ] 5.4.3 Test single agent: inject scenario → agent plans → acts → speaks
- [ ] 5.4.4 Scale to all 5 agents with turn management

### Story 5.5: Settings & API Key UI
- [ ] 5.5.1 Implement /api/settings/route.ts — validate API key (test call)
- [ ] 5.5.2 Implement SettingsPanel.tsx — API key input, save to localStorage
- [ ] 5.5.3 Pass key as x-api-key header on all API requests
- [ ] 5.5.4 Show key status indicator (valid/invalid/missing)

### Story 5.6: Demo Scenario
- [ ] 5.6.1 Implement ScenarioLoader.ts — load predefined scenario configs
- [ ] 5.6.2 Create B2B→B2C pivot scenario (5 agents + briefing)
- [ ] 5.6.3 Inject scenario briefing as initial perception for all agents

**Gate**: 5 agents autonomously discuss B2B→B2C pivot with real Claude calls, streaming bubbles.

---

## Epic 6: Full Cognitive Loop (Milestone 6)
> Memory retrieval, reflection, planning, perception, conversations.

### Story 6.1: Memory Retrieval
- [ ] 6.1.1 Implement importance scoring on memory creation (LLM call)
- [ ] 6.1.2 Implement keyword extraction for relevance matching
- [ ] 6.1.3 Implement retrieval scoring: recency (exponential decay) + importance + relevance
- [ ] 6.1.4 Implement top-K retrieval (default K=10)

### Story 6.2: Reflection Engine
- [ ] 6.2.1 Implement ReflectionEngine.ts — triggered when importance sum > threshold (15)
- [ ] 6.2.2 Generate 2-3 reflections via Claude
- [ ] 6.2.3 Add reflections to memory stream as type "reflection"
- [ ] 6.2.4 Show reflections as thought bubbles on client

### Story 6.3: Planning
- [ ] 6.3.1 Implement plan decomposition (high-level plan → sub-actions)
- [ ] 6.3.2 Support action sequences: move_to → speak → wait → move_to
- [ ] 6.3.3 Re-evaluate plan when significant new perceptions arrive
- [ ] 6.3.4 Include retrieved memories in planning context

### Story 6.4: Perception & Proximity
- [ ] 6.4.1 Deliver perceptions to agents in the same zone
- [ ] 6.4.2 Agent speech is perceived only by agents in same location
- [ ] 6.4.3 New observations added to memory stream automatically
- [ ] 6.4.4 Location changes trigger awareness updates

### Story 6.5: Conversation Management
- [ ] 6.5.1 Implement ConversationManager.ts — track active conversations
- [ ] 6.5.2 Auto-initiate conversation when agents meet in same location
- [ ] 6.5.3 Implement turn-taking within conversations
- [ ] 6.5.4 End conversation when agents leave or topic exhausted
- [ ] 6.5.5 Log conversations for replay

### Story 6.6: Phase Management (Optional)
- [ ] 6.6.1 Implement PhaseManager.ts — Setup → Gather → Discussion → Breakout → Reconvene → Decision
- [ ] 6.6.2 Phases can be enabled/disabled by user
- [ ] 6.6.3 Emit phase_change events via SSE

**Gate**: Agents reference past statements, reflect periodically, change plans based on conversation flow.

---

## Epic 7: User Interaction — React UI (Milestone 7)
> Full control panel, inspector, event log, prompt injection.

### Story 7.1: Control Panel
- [ ] 7.1.1 Implement ControlPanel.tsx — play/pause/step buttons
- [ ] 7.1.2 Add speed slider (0.5x, 1x, 2x, 4x)
- [ ] 7.1.3 Add simulation status indicator (running/paused/stopped)
- [ ] 7.1.4 Add tick counter display

### Story 7.2: Agent Inspector
- [ ] 7.2.1 Implement AgentInspector.tsx — opens on agent click
- [ ] 7.2.2 Show agent name, role, persona summary
- [ ] 7.2.3 Show memory stream (scrollable, most recent first)
- [ ] 7.2.4 Show current plan
- [ ] 7.2.5 Show relationship summary (opinions of other agents)
- [ ] 7.2.6 Show full conversation log for this agent

### Story 7.3: Event Log
- [ ] 7.3.1 Implement EventLog.tsx — scrollable timeline of all events
- [ ] 7.3.2 Filter by event type (speech, movement, reflection, system)
- [ ] 7.3.3 Filter by agent
- [ ] 7.3.4 Auto-scroll to latest event

### Story 7.4: Prompt Injection
- [ ] 7.4.1 Implement PromptInjector.tsx — text input area
- [ ] 7.4.2 Toggle: inject as "Moderator" (all agents perceive) or "Inner Voice" (target agent only)
- [ ] 7.4.3 Implement /api/simulation/inject — deliver prompt as perception
- [ ] 7.4.4 Show injection in event log

### Story 7.5: Agent Data Endpoints
- [ ] 7.5.1 Implement /api/agents — list all agents + current state
- [ ] 7.5.2 Implement /api/agents/[id]/memory — agent memory stream

### Story 7.6: Integration
- [ ] 7.6.1 Wire Phaser agent click → EventBus → React AgentInspector
- [ ] 7.6.2 Wire control panel buttons → API calls → SSE updates
- [ ] 7.6.3 Wire prompt injector → API → agent perception

**Gate**: Users can play/pause/step, inspect agents, view event log, inject prompts.

---

## Epic 8: Polish (Milestone 8)
> Visual polish, emotes, connection lines, scenario setup, export.

### Story 8.1: Reaction Emotes
- [ ] 8.1.1 Render animated emoji pop-ups above agents on reaction events
- [ ] 8.1.2 Emote types: thumbs up, question mark, exclamation, lightbulb, etc.
- [ ] 8.1.3 Pop-up + float + fade animation

### Story 8.2: Connection Lines
- [ ] 8.2.1 Draw lines between speaking agent and addressed agent
- [ ] 8.2.2 Color by agreement_score (green = agree, red = disagree, gray = neutral)
- [ ] 8.2.3 Fade lines after speech completes

### Story 8.3: Agent Status Indicators
- [ ] 8.3.1 Show activity emoji on sprite (speaking, thinking, planning, idle, reacting)
- [ ] 8.3.2 Update in real-time based on agent state

### Story 8.4: Camera Follow
- [ ] 8.4.1 Click agent → camera smoothly follows them
- [ ] 8.4.2 Manual camera movement cancels follow
- [ ] 8.4.3 "Follow active speaker" toggle

### Story 8.5: Scenario Setup
- [ ] 8.5.1 Implement ScenarioSetup.tsx — pre-simulation configuration screen
- [ ] 8.5.2 Edit agent names, roles, personas, colors
- [ ] 8.5.3 Edit scenario briefing text
- [ ] 8.5.4 "Start Simulation" button transitions to game view

### Story 8.6: Export & Misc
- [ ] 8.6.1 Export simulation log as JSON (download button)
- [ ] 8.6.2 Minimap in corner (stretch goal)
- [ ] 8.6.3 Final visual polish pass (consistent colors, animations, transitions)

**Gate**: Demo feels alive. Emotes, lines, camera follow, scenario setup all working.

---

## Summary

| Milestone | Stories | Tasks | Key Deliverable |
|-----------|---------|-------|-----------------|
| 1. The World | 7 | 22 | Tile map in browser |
| 2. Agents on Map | 4 | 14 | 5 agents + pathfinding |
| 3. Bubbles | 5 | 14 | Speech/thought bubbles |
| 4. Backend | 5 | 18 | Server orchestration + SSE |
| 5. Claude | 6 | 20 | Real LLM integration |
| 6. Cognitive Loop | 6 | 18 | Memory + reflection + planning |
| 7. User Interaction | 6 | 16 | Full React UI |
| 8. Polish | 6 | 13 | Demo-ready experience |
| **Total** | **45** | **135** | |
