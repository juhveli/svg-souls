# The Roast: SVG Souls Prototype Analysis

## 1. Architectural Overview
**Verdict:** 🍖 *Raw & Bloody (Prototype Quality)*

The current codebase is a classic "Game Jam" implementation. It works, it gets pixels on screen, but it is brittle, tightly coupled, and will likely collapse under the weight of a full "Souls-like" RPG complexity.

### The Good
*   **No Framework Bloat:** Usage of Vanilla TS and direct SVG manipulation means zero overhead. It's fast to start.
*   **Simple Input Handling:** The `InputSystem` singleton is clean and effective for this scale.
*   **Immediate Visuals:** Hardcoded SVGs mean instant feedback without asset pipelines.

### The Bad (The Roast)
*   **DOM Abuse in Loop:** `Entity.render()` calls `setAttribute` on SVG elements every single frame.
    *   *Why it burns:* This forces the browser to recalculate styles and layout constantly. For 2 entities, it's fine. For 50 enemies + particles? It will lag.
    *   *Fix:* Use `transform` matrix caching or batch DOM updates.
*   **God-Object Coupling:**
    *   `SerumBot` explicitly depends on `Player` in its constructor.
    *   `Game.ts` manually wires dependencies.
    *   *Why it burns:* You can't easily test `SerumBot` in isolation. If you add a cutscene where the player doesn't exist yet, the game crashes.
*   **Hardcoded "Spaghetti" Assets:**
    *   SVG strings (`PLAYER_SVG`, `BOT_SVG`) are defined as const strings inside code files.
    *   *Why it burns:* Artists cannot edit these. changing a color requires a code recompile. It mixes Data with Logic.
*   **Event Chaos:**
    *   Using `document.dispatchEvent` for `player-attack` is a "global variable" equivalent of event handling. It pollutes the global specific DOM event namespace.
*   **No Delta Time Fixed Step:**
    *   Physics runs on variable `dt` from `requestAnimationFrame`.
    *   *Why it burns:* At 144hz, the game might feel different than at 60hz (even with `dt` mulitplication, float errors accumulate). Souls-like combat requires deterministic frame data (e.g., "This attack is exactly 15 frames").

---

## 2. Lore Integration Feasibility (The "Bark" System)

The `active_storytelling.md` calls for an **Event-Driven Narrative System** (The "Bark" System), where enemies react to:
1.  Spotting Player
2.  Taking Damage
3.  dying

**Current Status:** IMPOSSIBLE to implement cleanly.
*   `SerumBot` currently handles its own logic and just "exists".
*   There is no "State Machine" that exposes *transitions* (e.g., Idle -> Chase) to an outside observer.
*   There is no UI layer capable of positioning text bubbles over moving SVG entities.

---

## 4. World & Environment Analysis
**Verdict:** 🏜️ *Barren Wasteland*

The user asked about "Area Descriptions" and "Transitions". I checked `ScrapyardMap.ts`.
*   **Missing Features:**
    *   **No Transitions:** The game is a single 800x600 room. There is no code to handle "leaving" this room to enter another.
    *   **No Narrative Descriptions:** There is no UI text for "Entering The Rust Heap" or inspecting elements.
    *   **Fake Geography:** "Obstacles" are just SVG shapes drawn on the floor. They have *no collision*. You can walk right through the "Broken Gear".
*   **Why it burns:** You cannot tell a story of "Exploration" if the world is a single static screen with no interactive props.

---

## 5. Action Plan: The Refactor

We will not rewrite the engine from scratch, but we will "Component-ize" it to allow the Narrative System to hook in.

### Phase 1: Decoupling (The Prep)
1.  **Introduce `EventManager`:** Replace `document.dispatchEvent` with a typed internal Event Bus.
2.  **State Machine:** Move `SerumBot` logic into a simple State Machine (`IdleState`, `ChaseState`, `AttackState`).
    *   *Benefit:* The Narrative System can listen for `StateChanged(Idle -> Chase)` to trigger the "Spotting Player" bark.

### Phase 2: The "Bark" Component
1.  **Create `BarkSystem`:** A system that listens to game events.
    *   Input: `ENTITY_DAMAGED`, `ENTITY_SPOTTED`, `ENTITY_DIED`.
    *   Logic: Checks a `LoreDictionary` (JSON) for lines associated with that Entity ID.
    *   Output: Emits a `SHOW_BARK` event.
2.  **Create `BarkUI`:**
    *   A simplified HTML overlay (absolute positioned `<div>`s) on top of the SVG canvas.
    *   Updates position every frame to match the SVG entity's screen coordinates.
    *   Standard HTML styling for bubbles (much easier than SVG text).

### Phase 3: World & Transition Logic
1.  **Map Metadata:** Update `ScrapyardMap` to include a `name` and `description` string.
2.  **Zone Triggers:** Add a simple `ZoneSystem` that checks player coordinates.
    *   If Player > 780 X, Trigger `WalkEast`.
    *   Show "Toast" UI: "Leaving Scrapyard... Entering Glass Gardens".

## Summary
## 6. Review of New Systems (BarkSystem & ZoneSystem)
**Verdict:** 🥗 *Fresh Salad in a Steakhouse*

I reviewed `BarkSystem.ts` and `ZoneSystem.ts`.

### The Good
*   **Separation of Concerns:** `BarkSystem` properly delegates visual rendering to `UIManager`. It doesn't try to touch the DOM itself. This is a huge improvement over `SerumBot` drawing its own blood particles.
*   **Data-Driven:** `LORE_DB` in `BarkSystem` explicitly separates the "What" (Text) from the "How" (Rendering). This allows writers to edit text without breaking code.
*   **Zone Logic:** `ZoneSystem` introduces the concept of *spatial triggers* which was completely absent.

### The Bad (The Roast)
*   **Floating Systems:** Currently, these systems are "Orphans". `Game.ts` does not call `ZoneSystem.update()`. They rely on manual console commands to work.
*   **DOM Hacks:** `ZoneSystem` injects `<style>` tags for animations. Effective for a jam, but messy for a long-term project.
*   **Singleton Overload:** `BarkSystem` depends on `UIManager.getInstance()`. If `UIManager` initializes *after* `BarkSystem`, it crashes.

### The Next Steps (Architecture)
To fix the "Orphan" issue and the "God Object" issue defined in Section 1, we need:
1.  **`EventManager.ts`**: To let `ZoneSystem` tell `Game` "Hey, change the background color" without `ZoneSystem` having to know about `Game`.
2.  **`StateMachine.ts`**: To let `SerumBot` cleanly switch between 'Idle' and 'Chase' so `BarkSystem` knows *exactly* when to trigger an 'Aggro' bark.

## 7. Next 2 Priority Files
1.  **`src/engine/EventManager.ts`**: The backbone of decoupling.
2.  **`src/engine/StateMachine.ts`**: The brain for smarter entities.
