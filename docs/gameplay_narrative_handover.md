# Dev Handover: Gameplay & Narrative Integration
**Project:** Chronocrystal (Working Title)
**Version:** 1.0
**Target:** Engineering & Design Teams

## 1. Core Pillar: "Time is Sound, Matter is Crystal"
The narrative dictates that the world is a broken clockwork mechanism made of glass. This is not just flavor text; it is the **primary gameplay loop**.

### 1.1 The "Resonance" Resource System
*   **Narrative Context:** The player is "The Soft One" (Cloth/Flesh), the only being that absorbs vibration. Enemies are "Fractured" (Glass), reflecting it.
*   **Code Mechanic:**
    *   **Mana = Resonance.**
    *   **Gain:** Hitting enemies generates "Vibration" (Mana).
    *   **Loss:** Getting hit adds "Dissonance" (Debuff/Damage).
    *   **Overload:** If Resonance hits 100%, the player "shatters" (casts a forced AoE but takes damage).
*   **Dev Requirement:** Need a `ResonanceController` that tracks a float value (0-100) and modifies audio pitch based on current level.

### 1.2 "Shatter" Physics
*   **Narrative Context:** Enemies are made of crystallized time. They don't bleed; they break.
*   **Code Mechanic:**
    *   **Health:** Non-standard. Enemies have "Integrity" (HP) and "Stress" (Stagger).
    *   **Death State:** No ragdolls. Enemies must procedurally shatter into `n` shards.
    *   **Hazard Generation:** Shards remain on the ground as physical objects. Walking on them causes damage/noise unless the player "Dampens" (Sneaks).
*   **Dev Requirement:** Implement a 2D mesh slicing or sprite-masking system for death animations. Shards must interact with the physics engine.

---

## 2. World Mechanics: The Broken Timeline

### 2.1 "Time-Skip" Zones
*   **Narrative Context:** The Shatter broke time flow in specific areas.
*   **Code Mechanic:**
    *   **Zone Triggers:** Narrative zones that alter `Time.deltaTime`.
    *   **The "Loop" Room:** A room that resets every 10 seconds. Player position is conserved, but enemies/traps reset.
    *   **The "Fast" Room:** Enemy animation speed = 2.0x, but Player speed = 1.0x (Simulating being "slow" in a fast timeline).
*   **Dev Requirement:** A `TimeManager` capable of applying different time scales to specific `GameObject` layers (e.g., `EnemyLayer` vs `PlayerLayer`).

### 2.2 The "Grand Carillon" (Global Event)
*   **Narrative Context:** Every in-game "hour," the giant bell tolls.
*   **Code Mechanic:**
    *   **Global Pulse:** A screen-shake and audio cue that stuns all "Glass" enemies for 2 seconds (Free hits).
    *   **Boss Synergy:** Bosses have special attacks that *only* trigger during the Carillon toll.

---

## 3. Player Kit: "The Damper"

The player is designed to be the *antithesis* of the world.

| Ability | Narrative Justification | Gameplay Implementation |
| :--- | :--- | :--- |
| **Dampen (Passive)** | You are soft; you make no sound. | Footsteps generate 0 noise radius (Stealth default). |
| **Tunge (Parry)** | Catching a blade to stop its vibration. | Perfect Block restores massive "Resonance" and freezes the enemy for 0.5s. |
| **Harmonic Dash** | Vibrating at the frequency of light to move through glass. | Invincibility frames (i-frames) that allow passing *through* enemies, dealing "Shatter" damage. |

---

## 4. Enemy Archetypes & AI

### 4.1 The Fractured Citizen (Basic Mob)
*   **Behavior:** Jerky, loop-based movement (like a skipping CD).
*   **Attack:** "Glitch" attack—teleports 1 meter forward instantly before striking (requires audio cue anticipation).

### 4.2 The Metronome Sentry (Elite)
*   **Behavior:** Moves strictly on the beat of the BGM (120 BPM).
*   **Vulnerability:** Player deals 2x damage if hitting them on the "off-beat."
*   **Dev Requirement:** `EnemyAI` must subscribe to `AudioController.BeatEvent`.

---

## 5. Technical visual & Audio Needs

*   **Audio-Reactive Shaders:** The world pulse (lighting/glow) must sync with the BGM.
*   **Dynamic Mixing:** When Player Health < 20%, apply a `LowPassFilter` (simulation of "going into shock" or "losing resonance").
*   **UI:** The HUD should be a cracked glass overlay. Resonance meter is a tuning fork that vibrates visually.

---

## 6. Implementation Priorities
1.  **Core Controller:** Player movement + "Dampen" passive.
2.  **Shatter System:** Basic enemy death VFX (Sprite swap to shards).
3.  **Rhythm AI:** One enemy type that attacks on a beat.
