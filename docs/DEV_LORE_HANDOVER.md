# Developer Handover: Narrative Integration Update

**To:** Engineering & Design Teams
**From:** Narrative Design
**Subject:** Implementing "Active Storytelling" & The Chronocrystal Loop

## Executive Summary
We have finalized the narrative direction for *Chronocrystal*. The core directive is **"Gameplay IS Story."** We are moving away from passive text logs and cutscenes. Instead, the lore must be communicated through **Audio Cues**, **Visual Environmental Storytelling**, and **Combat Mechanics**.

## Key Documentation
All detailed specifications are located in `docs/`:
1.  **`active_storytelling.md`** -> **CRITICAL READ.** Defines the "Bark System" and Diegetic UI rules.
2.  **`world_bible.md`** -> Context for art assets (Crystal/Clockwork aesthetic).
3.  **`gameplay_narrative_handover.md`** -> Technical specs for the Resonance/Heat mechanics.

## Implementation Guidelines

### 1. The "Bark" System (Engineering)
*   **Requirement:** Implement `AudioTrigger` components on all enemies.
*   **Logic:** Enemy barks are not random. They must trigger on state changes (`OnAggro`, `OnDamage`, `OnDeath`).
*   **Why:** This is how we tell the player that enemies are "trapped in time loops" without pausing the game.

### 2. Diegetic UI (UI/UX)
*   **Requirement:** Remove standard HUD elements where possible.
*   **Implementation:**
    *   *Health:* Post-processing Desaturation effect (Black & White) as health drops.
    *   *Mana (Resonance):* Audio Reverb levels + Visual "Vibration" blur on the character model.

### 3. Rhythm Mechanics (gameplay)
*   **Requirement:** Global `BPMController` needed for Area 3.
*   **Implementation:** Hazards and Enemy AI in "The Clockwork Arteries" must sync to the background track.

### 4. Level specific Hooks
*   **Area 1 (Scrapyard):** Implement "Time-Slow" zones (Physics gravity modification).
*   **Area 2 (Glass Gardens):** Implement "Reflection Rendering" for mirrors (RenderTexture showing alternate "Golden Age" geometry).
*   **Area 4 (Hushed Halls):** Implement "Audio Muting" zones where sound effects are disabled.

## Final Note
The goal is **Immersion**. If the player has to stop playing to read about the story, we have failed. The story is that the world is a broken instrument; the player is here to fix the tune. let the mechanics reflect that.

---
*Reference Design Documents: `area_01_design.md` through `area_04_design.md`*
