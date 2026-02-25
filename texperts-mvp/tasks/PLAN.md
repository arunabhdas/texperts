# Plan

## 24Feb2026


     Studio Ghibli Visual Overhaul — Full App Aesthetic

     Context

     The entire texperts.ai app needs a Studio Ghibli-inspired visual treatment with dark mode. Currently, the app uses cold Tailwind grays,
     Material Design accent colors, pixelated Phaser rendering, and monospace fonts. The goal is a warm, organic, hand-crafted feel throughout —
     game board, agents, bubbles, and all React UI panels.

     Ghibli dark mode characteristics:
     - Warm dark backgrounds (charcoal-brown, not cold gray)
     - Muted, earthy accent colors (sage, terracotta, sky, honey, wisteria)
     - Soft golden/amber highlights instead of pure white
     - Organic rounded shapes, gentle shadows
     - Sans-serif typography with warm tones
     - Game board as a "warm window" with twilight-toned tiles

     ---
     Files to Modify (10 files, in order)

     Step 1: src/game/config.ts

     - pixelArt: false, antialias: true
     - backgroundColor: "#1e1b2e" (warm dark indigo)

     Step 2: src/app/globals.css

     Add Ghibli CSS custom properties and base overrides:
     :root {
       --ghibli-bg-deep: #1a1520;
       --ghibli-bg: #211c28;
       --ghibli-bg-surface: #2a2433;
       --ghibli-bg-elevated: #342d3d;
       --ghibli-border: #3d3548;
       --ghibli-border-subtle: #2f2938;
       --ghibli-text: #e8dfd0;
       --ghibli-text-secondary: #a89e8c;
       --ghibli-text-muted: #7a7068;
       --ghibli-accent-gold: #d4a857;
       --ghibli-accent-warm: #c4956a;
     }
     Override scrollbar styling for warm dark look. Body background uses --ghibli-bg-deep.

     Step 3: src/app/layout.tsx

     - Replace bg-gray-950 text-gray-100 with custom Ghibli background and warm text color using the CSS vars.

     Step 4: src/game/scenes/BootScene.ts

     Replace generateRect() with Canvas 2D texture generation:

     Tile palette (twilight warmth — darker than current but still warm):

     ┌───────────┬─────────┬─────────┬─────────────────────────┐
     │   Tile    │   Old   │   New   │          Notes          │
     ├───────────┼─────────┼─────────┼─────────────────────────┤
     │ floor     │ #f5f0e8 │ #3d3832 │ Warm dark stone         │
     ├───────────┼─────────┼─────────┼─────────────────────────┤
     │ floor_alt │ #e8e0d0 │ #352f2a │ Slightly darker variant │
     ├───────────┼─────────┼─────────┼─────────────────────────┤
     │ wall      │ #4a4a4a │ #28222a │ Dark warm charcoal      │
     ├───────────┼─────────┼─────────┼─────────────────────────┤
     │ furniture │ #8b6914 │ #5a4a2e │ Dark warm wood          │
     ├───────────┼─────────┼─────────┼─────────────────────────┤
     │ door      │ #ddd5c0 │ #6a5e50 │ Lighter warm stone      │
     └───────────┴─────────┴─────────┴─────────────────────────┘

     Each tile gets a subtle top-to-bottom gradient (5% luminance shift) and noise jitter (+-2 per RGB channel) for watercolor paper texture.

     Agent body textures — 64x64 canvas per agent, 5 layers:
     1. Ground shadow ellipse (radial gradient, black at alpha 0.12)
     2. Main body (radial gradient: palette.light center → palette.mid edge, radius 22px)
     3. Inner highlight (white 0.35 → transparent, offset -5,-6, radius 12px)
     4. Warm outline (palette.outline at alpha 0.6, 1.5px stroke)
     5. Noise pass (+-3 luminance jitter for watercolor feel)

     Step 5: src/game/entities/AgentSprite.ts

     Ghibli palette (keyed by original hex color):

     ┌────────────────────┬─────────┬─────────┬─────────┬─────────┐
     │       Agent        │  Light  │   Mid   │  Dark   │ Outline │
     ├────────────────────┼─────────┼─────────┼─────────┼─────────┤
     │ Visionary 0x4caf50 │ #9ED8A0 │ #6BB86E │ #4A8A4D │ #3D6B3F │
     ├────────────────────┼─────────┼─────────┼─────────┼─────────┤
     │ Skeptic 0xf44336   │ #E8A49E │ #C4706A │ #9E4F4A │ #7A3B37 │
     ├────────────────────┼─────────┼─────────┼─────────┼─────────┤
     │ Builder 0x2196f3   │ #9EC8E8 │ #6A9FC4 │ #4A7A9E │ #375B7A │
     ├────────────────────┼─────────┼─────────┼─────────┼─────────┤
     │ Whisperer 0xffeb3b │ #F0DDA0 │ #D4BA6A │ #B09848 │ #8A7638 │
     ├────────────────────┼─────────┼─────────┼─────────┼─────────┤
     │ Devil 0x9c27b0     │ #C8A0D8 │ #9E72B4 │ #7A508A │ #5E3D6B │
     └────────────────────┴─────────┴─────────┴─────────┴─────────┘

     Changes:
     - Replace Graphics body → Sprite from pre-baked texture (scale 0.4375 for 28px display)
     - SPRITE_RADIUS: 12 → 14
     - Selection ring: warm gold #d4a857 with pulsing alpha tween (0.4→0.7, 1200ms)
     - Name label: sans-serif, warm off-white #e8dfd0, colored stroke from palette outline
     - Role label: sans-serif, warm gray #a89e8c
     - Breathing animation: float 1.5px / 1400ms + scale pulse 1.0→1.02, random phase offset
     - Movement ease: Linear → Sine.easeInOut

     Step 6: src/game/entities/BubbleManager.ts

     - Speech fill: #fff8f0 at 0.92, border #d4c8b8 at 1.0px, corner radius 8
     - Shadow: warm brown #3d2b1f at alpha 0.06
     - Text font: sans-serif
     - Thought fill: #f0eef8 at 0.85, border #a89ec0
     - Text font: sans-serif

     Step 7: src/game/scenes/MainScene.ts

     - Zone labels: sans-serif, color #a89e8c, background #2a243380 (warm dark semi-transparent)
     - Zone overlays: alpha 0.06 (more subtle on dark tiles)
     - Connection lines: max alpha 0.35

     Step 8: src/components/SimulationApp.tsx

     Replace all Tailwind gray classes with Ghibli warm tones:

     bg-gray-900  →  bg-[#211c28]    (--ghibli-bg)
     bg-gray-800  →  bg-[#2a2433]    (--ghibli-bg-surface)
     bg-gray-700  →  bg-[#342d3d]    (--ghibli-bg-elevated)
     border-gray-800  →  border-[#3d3548]  (--ghibli-border)
     text-gray-500  →  text-[#a89e8c]  (--ghibli-text-secondary)
     text-gray-400  →  text-[#a89e8c]
     text-gray-300  →  text-[#e8dfd0]  (--ghibli-text)
     text-gray-600  →  text-[#7a7068]  (--ghibli-text-muted)

     Header title gets warm golden accent. "texperts.ai" uses text-[#d4a857].

     Step 9: All React components — apply same color mapping

     HeaderControls.tsx:
     - Buttons: bg-[#342d3d] hover:bg-[#3d3548] (warm elevated surfaces)
     - Speed select: bg-[#2a2433] border-[#3d3548] text-[#e8dfd0]
     - Status text: text-[#a89e8c]

     AgentInspector.tsx:
     - Card backgrounds match memory type:
       - reflection: border-[#5E3D6B]/40 bg-[#5E3D6B]/10 (wisteria)
       - plan: border-[#375B7A]/40 bg-[#375B7A]/10 (sky blue)
       - observation: border-[#3d3548] bg-[#211c28]/50
     - Type labels use palette colors (wisteria for reflection, sky for plan)
     - Content text: text-[#e8dfd0]
     - Tabs: active bg-[#342d3d] text-[#e8dfd0], inactive text-[#7a7068]
     - Emotion colors (muted Ghibli variants):
       - confident: text-[#9ED8A0] (sage)
       - uncertain: text-[#F0DDA0] (honey)
       - skeptical: text-[#E8A49E] (terracotta)
       - excited: text-[#9ED8A0] (sage bright)
       - alarmed: text-[#c4956a] (warm amber)
       - neutral: text-[#a89e8c] (warm gray)
       - amused: text-[#C8A0D8] (wisteria)

     EventLog.tsx:
     - Type colors (muted):
       - speech: text-[#9ED8A0] (sage)
       - thought: text-[#9EC8E8] (sky)
       - movement: text-[#F0DDA0] (honey)
       - reflection: text-[#C8A0D8] (wisteria)
       - system: text-[#7a7068] (muted)
       - injection: text-[#c4956a] (amber)
     - Content: text-[#e8dfd0]

     PromptInjector.tsx:
     - Moderator active: bg-[#8a5a30] text-[#e8dfd0] (warm amber-brown)
     - Inner Voice active: bg-[#5E3D6B] text-[#e8dfd0] (wisteria)
     - Input: bg-[#2a2433] border-[#3d3548] text-[#e8dfd0] placeholder-[#7a7068]
     - Focus: focus:border-[#d4a857] (golden focus ring)

     SettingsPanel.tsx:
     - Modal: bg-[#211c28] border-[#3d3548]
     - Input: bg-[#2a2433] border-[#3d3548] text-[#e8dfd0] focus:border-[#d4a857]
     - Save button: bg-[#4A7A9E] hover:bg-[#5a8aae] (soft blue instead of bright blue-600)
     - Success: text-[#9ED8A0] (sage green)
     - Error: text-[#E8A49E] (terracotta)

     ScenarioSetup.tsx:
     - Modal: bg-[#211c28] border-[#3d3548]
     - Scenario box: bg-[#1a1520] border-[#2f2938]
     - Agent cards: border-[#3d3548]
     - Start button: bg-[#4A8A4D] hover:bg-[#5a9a5d] (sage green)
     - Checkbox accent: accent-[#d4a857] (golden)

     Step 10: tailwind.config.ts

     Extend theme with Ghibli color palette for reuse:
     colors: {
       ghibli: {
         deep: '#1a1520',
         bg: '#211c28',
         surface: '#2a2433',
         elevated: '#342d3d',
         border: '#3d3548',
         'border-subtle': '#2f2938',
         text: '#e8dfd0',
         secondary: '#a89e8c',
         muted: '#7a7068',
         gold: '#d4a857',
         warm: '#c4956a',
       }
     }

     ---
     Verification

     1. npx tsc --noEmit — no TS errors
     2. npm run dev — open browser at localhost:3002, verify:
       - Overall: warm dark atmosphere, no cold grays anywhere
       - Game board: dark warm tiles with subtle gradients, feels like twilight
       - Agents: soft gradient bodies with ground shadows, warm labels
       - Selection ring: golden pulse, not white
       - Breathing animation: gentle, not uniform
       - Movement: smooth Sine ease
       - Bubbles: warm cream speech, soft lavender thought
       - Header: warm dark bg, golden "texperts.ai" title
       - Sidebar inspector: warm-toned cards, muted palette colors
       - Event log: muted Ghibli accent colors, warm text
       - Prompt injector: warm amber/wisteria mode buttons, golden focus
       - Settings modal: warm dark with golden accents
       - Scenario setup: warm dark, sage green start button
       - Zone labels: warm dark semi-transparent background
       - No pixelation on zoom in/out
