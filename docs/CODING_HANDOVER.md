# Coding Handover v1.0

**Date:** 2025-12-22
**Status:** Transitioning from Prototype to Alpha Architecture.

## 1. Executive Summary
We have successfully implemented the "Decoupling Layer" for the game engine. The codebase is moving away from "God Objects" (Direct Object-to-Object coupling) to an **Event-Driven Architecture**.

## 2. New Components (Ready for Wiring)
The following files have been created but are **NOT YET WIRED** into the main `Game.ts` loop.

### A. Core Architecture (`src/engine/`)
*   **`EventManager.ts`**: A singleton Event Bus.
    *   *Usage:* `EventManager.getInstance().emit('EVENT_NAME', data)`
    *   *Goal:* Replace all `document.dispatchEvent` calls.
*   **`StateMachine.ts`**: A generic base class for Entity logic.
    *   *Usage:* `SerumBot` should extend this or hold an instance of it.
    *   *Goal:* Allow `BarkSystem` to listen for specific state changes (e.g., `Idle` -> `Chase`).

### B. Gameplay Systems (`src/systems/`)
*   **`BarkSystem.ts`**: Handles Narrative "Barks" (text bubbles).
    *   *Usage:* `BarkSystem.getInstance().trigger(...)`
    *   *Current State:* Delegates rendering to `UIManager`.
*   **`ZoneSystem.ts`**: Handles Map Transitions.
    *   *Usage:* `ZoneSystem.getInstance().checkTransition(playerX, playerY)`
    *   *Current State:* Implements logic for "Scrapyard" <-> "Glass Gardens" loop.

## 3. Wiring Instructions (For the Bug-Fix Team)
Please perform the following hook-ups in `Game.ts` and `SerumBot.ts`:

1.  **Game Loop (`Game.ts`)**:
    ```typescript
    // In update/loop method:
    ZoneSystem.getInstance().checkTransition(this.player.x, this.player.y);
    ```
2.  **Enemy Logic (`SerumBot.ts`)**:
    *   Replace hardcoded state strings (`'IDLE' | 'CHASE'`) with the new `StateMachine` class.
    *   On Death/Damage, fire events via `EventManager` instead of calling `UIManager` directly.
    ```typescript
    // Example:
    EventManager.getInstance().emit('ENTITY_DAMAGED', { id: this.id, amount: 10 });
    ```
3.  **Bark Hookup**:
    *   `BarkSystem` should subscribe to `EventManager`.
    *   `EventManager.on('ENTITY_DAMAGED', (data) => BarkSystem.trigger(data.id, 'DAMAGE'));`

## 4. Next Steps: Progression Loop
We are prioritizing **"Fun & Progression"** next.
*   **Objective:** Give the player a reason to fight.
*   **Plan:**
    1.  **`ProgressionSystem.ts`**: Track XP/Scrap and Stats.
    2.  **`LootSystem.ts`**: Reward the player upon killing Enemies (via EventManager).

---
*Reference: See `docs/codebase_roast.md` for architectural context.*
