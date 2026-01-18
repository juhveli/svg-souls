# Developer Handover: Graphics & VFX Implementation

**To:** Engineering Team
**From:** Technical Narrative Design
**Subject:** Implementing "The Chronocrystal" Visual Stack (SVG)

## Executive Summary
We are proceeding with an **SVG-First** approach for visual effects. The "Glass" and "Clockwork" aesthetic will be achieved using W3C standard SVG Filters (`<filter>`) rather than canvas pixel manipulation. This ensures crisp scaling and performance on the DOM layer.

## Key Documentation
*   **`graphics_transition_plan.md`** -> **CRITICAL READ.** Contains the specific XML filter definitions for Glass and Noise.

## Implementation Priorities

### 1. The "Glass" Shader (feSpecularLighting)
*   **Target:** All "Fractured" enemies and Crystal platforms.
*   **Tech:** Use `feSpecularLighting` to simulate a shiny, refractive surface on vector shapes.
*   **Lore Connection:** Reinforces the "Matter is Crystal" pillar.

### 2. Parallax Backgrounds (DOM Groups)
*   **Target:** The "Clockwork Arteries" and "Glass Gardens" backgrounds.
*   **Tech:** Implement a `CameraSystem` that updates the `transform: translate()` of background `<g>` groups at different rates (0.2x, 0.5x).
*   **Lore Connection:** Gives the sense of the infinite "Grand Carillon" machine depth.

### 3. The "Shatter" Glitch (feDisplacementMap)
*   **Target:** Screen Transitions and "Time Skip" events.
*   **Tech:** Animate `scale` on a `feDisplacementMap` linked to `feTurbulence`.
*   **Lore Connection:** Visually represents the timeline fracturing.

## Asset Pipeline
*   Design assets in Illustrator/Inkscape.
*   Export as optimized SVG.
*   Apply class names (`.glass`, `.metal`, `.void`) to groups to auto-inherit the SVG filters defined in `index.html`.

---
*Reference: `/docs/graphics_transition_plan.md`*
