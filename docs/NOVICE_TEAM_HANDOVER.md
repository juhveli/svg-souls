# Handover Document: Project Chronocrystal

Welcome, Team! This document outlines the current state of **Chronocrystal**, a lore-driven SVG-based action game, and provides a clear roadmap for the next phases of development.

## 1. Core Philosophy: "Gameplay IS Story"
In this project, every mechanic must serve the lore:
*   **Time is Sound:** Audio cues are gameplay cues. Silence is death (health desaturation).
*   **Matter is Crystal:** Surfaces are refractive and fragile (SVG glass filters).
*   **The Shatter:** Dissonance creates glitches (damage-triggered SVG displacement).

## 2. Technical Architecture
The game is built using a custom SVG-first engine. Key systems include:
*   **`LoreFXSystem.ts`**: Handles advanced visuals (Cymatics, Echo Trails, Caustics). **Don't touch the math here unless you understand SVG `<defs>` filters.**
*   **`EventManager.ts`**: The global bus for inter-system communication. Use `emit` and `on` to decouple systems.
*   **`ZoneSystem.ts`**: Manages world transitions and area-specific physics (Time Dilation).
*   **`BarkSystem.ts`**: Handles context-aware enemy dialogue.

## 3. Current Status: Area 1 "The Scrapyard" (100% Implemented)
Area 1 is our "Vertical Slice." It includes:
*   **Stealth:** Sneaking with `Shift` halves detection range.
*   **Physics:** "The Heavy Room" uses `physicsDt` scaling for slow-motion.
*   **Narrative Items:** Mirror and Ledger classes for environmental storytelling.
*   **Boss:** Golgotha is functional as the end-of-zone climax.

## 4. Prioritized Next Steps (Your Task)

### Phase 1: Area 2 "The Glass Gardens"
Currently has basic geometry but lacks mechanics.
1.  **Reflection Mechanic:** Implement the "Silver Mirror" logic. Enemies should be visible *only* in the reflection or via specific Resonance bursts.
2.  **Flora Interaction:** Crystal flora should shatter when hit, providing Resonance shards.
3.  **Active Barks:** Add "Polite" barks for the Porcelain Dancers (Area 2 enemies).

### Phase 2: Area 3 "The Clockwork Arteries"
1.  **Rhythm Hazards:** Create traps synced to the `AudioController` beat.
2.  **Overheat Mechanic:** Build the UI and logic for the oppressive heat that disables abilities if the player stays still.

### Phase 3: Global Polish
1.  **AI Refinement:** SerumBots need better pathfinding (currently they just slide towards the player).
2.  **Diegetic UI:** Move the Resonance bar into a subtle visual element on the Player's SVG model.

## 5. Critical Warnings ⚠️
*   **SVG Performance:** Avoid adding thousands of elements to the DOM. Use `SVGAssets.ts` to keep paths efficient.
*   **Event Loops:** Always use `safeDt` (clamped) in the `Game.ts` loop to prevent physics explosion on lag spikes.
*   **Filters:** The `#shatter-glitch` filter is expensive. Keep its `scale` at 0 when not in use.

---
*Good luck. Maintain the Resonance.*
