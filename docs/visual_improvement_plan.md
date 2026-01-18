# Research Plan: Advanced Lore-Friendly Visuals
**Objective:** Improve visuals not by adding "juice," but by making the metaphysics of the world (Time/Sound/Crystal) visible.

## 1. Visualizing Sound: "Cymatics"
*   **The Concept:** In a world made of crystal, sound physically shapes matter.
*   **The "Obvious" (Wrong) Approach:** Standard screen shake.
*   **The Lore-Deep Approach:** **Geometric Floor Patterns.**
    *   *Research:* Study "Chladni Plates" (sand on vibrating metal).
    *   *Implementation:* When a heavy stomp (Metronome Sentry) happens, the *ground texture itself* should shift into a geometric mandala pattern for a split second, representing the standing wave of the impact.

## 2. Visualizing Time: "Echo Trails" for Movement
*   **The Concept:** The Soft One moves "between" beats.
*   **The "Obvious" (Wrong) Approach:** Standard motion blur.
*   **The Lore-Deep Approach:** **Discrete Ghosting.**
    *   *Research:* "Chronophotography" (Marey/Muybridge).
    *   *Implementation:* Instead of a blur, the player leaves behind 3 static "frames" of themselves that linger for 0.5s. It shows that movement is just a series of static moments stitched together.

## 3. Visualizing Fragility: "Dynamic Caustics"
*   **The Concept:** Light passing through the characters.
*   **The "Obvious" (Wrong) Approach:** Shiny sprites.
*   **The Lore-Deep Approach:** **Projected Caustics.**
    *   *Research:* Light refraction through glass prisms.
    *   *Implementation:* Characters shouldn't just have shadows; they should cast "Light Pools" containing rainbows. "The Fractured" (Enemies) cast sharp, jagged light. "The Soft One" (Player) casts a dull, shapeless shadow (absorbing light).

## 4. Environment: "The Breathing World"
*   **The Concept:** The world is a machine.
*   **The Obvious Approach:** Moving gears in the background.
*   **The Lore-Deep Approach:** **Pulsing Geometry.**
    *   *Implementation:* The entire level geometry (walls, floors) should expand/contract slightly on the beat of the music (The Heartbeat). The world isn't static; it's a living lung.

## Next Steps
1.  **Prototype Chladni Shaders:** Create an SVG pattern that changes complexity based on "Volume" (Game Event).
2.  **Prototype Chrono-Ghosting:** Implement a particle system that spawns full-body clones of the player.
3.  **Prototype Pulsing World:** Bind the `transform: scale()` of the root world group to the BGM beat.
