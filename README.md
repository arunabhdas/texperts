# texperts
Texperts

## Develop and test locally
⏺ Here's how to run and test locally:

  1. Install dependencies

  cd texperts-mvp
  npm install

  2. Set up API key (optional)

  cp .env.local.example .env.local
  # Edit .env.local and add your Anthropic API key
  Without a key, the simulation runs in mock mode with scripted agent responses — still fully functional for testing the UI.

  3. Start the dev server

  npm run dev
  Opens at http://localhost:3000 (or 3001/3002 if 3000 is in use).

  4. Test the app

  Mock mode (no API key):
  1. Open the app — you'll see the ScenarioSetup screen
  2. Check the "I understand this uses Claude API credits" box and click Start Simulation
  3. Agents will play through scripted actions: think → move to boardroom → speak
  4. Click an agent to inspect their memory in the right panel
  5. Use WASD/arrows to pan, mouse wheel to zoom, right-click drag to pan
  6. Try the Prompt Injector in the bottom-right

  With Claude API key:
  1. Either set ANTHROPIC_API_KEY in .env.local, or click Settings in the header and enter your key
  2. Start the simulation — agents will make real Claude API calls
  3. You'll see streaming responses appear as typewriter text in speech bubbles
  4. Reflections will trigger automatically after enough observations accumulate

  Controls:
  - Start/Pause/Resume — top-right buttons
  - Step — advance one tick manually (only when paused)
  - Speed — 0.5x / 1x / 2x / 4x dropdown
  - Export — download event log as JSON
  - Click agent — camera follows + inspector shows memory/plan

  5. Verify build

  npx tsc --noEmit    # type check
  npm run build       # production build
