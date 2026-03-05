# ART STYLE GUIDE: The Rusty Bit

## Core Philosophy
**"The 16-bit Zelda aesthetic, but the cartridge was left in the rain for a decade."**

We are emulating the limitations and techniques of the SNES/GBA era (specifically *Link to the Past* and *Minish Cap*) but applying them to a *Dark Souls* / *Bloodborne* cosmology.

> **NOTICE:** The visual direction of the game is actively transitioning from a procedural SVG/WebGPU hybrid to a **2D Isometric Pixel-Art style** (heavily inspired by `unnamed.jpg`).
> Please refer to the [Isometric Transition Plan](ISOMETRIC_TRANSITION_PLAN.md) for detailed technical and pipeline instructions. The pillars below reflect the target aesthetic.

## The 4 Pillars

### 1. Perspective & Projection (Transitioning to Isometric)
*   **Isometric Projection:** The world is viewed at an angle where the X and Y axes are tilted by roughly 30 degrees (a 2:1 pixel ratio). Objects show top, front, and side planes to create a 2.5D illusion.
*   **Grid Alignment:** All assets must align to an isometric diamond grid (e.g., 64x32 pixels per tile).
*   **No Free Rotation:** Sprites do not rotate freely. Entities must be drawn with distinct directional frames corresponding to the isometric axes.

### 2. The Palette of Decay
We avoid primary colors. The world is oxidized.
*   **Rust:** `#5a3a2a` (Base), `#3a2a1a` (Shadow), `#8a5a4a` (Highlight)
*   **Verdigris:** `#4a6a5a` (Oxidized Copper)
*   **Void:** `#1a1a1a` (The abyss), `#0a0a0a` (Deepest shadow)
*   **Soul/Resonance:** `#44ffff` (Cyan - pure), `#ff4444` (Corrupted)

### 3. Construction Techniques
*   **Outline Rule:** Assets must have a dark (usually not black, but very dark colored) outline to separate them from the background.
*   **Pixel Density:** Do not use large flat rectangles. Break up surfaces with "noise" pixels to imply texture (rust flakes, bolts, dents).
*   **High Contrast:** Light sources are dim. Highlights should be sharp and small (specular), shadows deep and large.

### 4. Implementation (Pixel Art & Sprite Batching)
*   **True Pixels:** The game will use actual rasterized pixel art (PNGs) rather than simulated SVG pixels.
*   **Strict Integer Coordinates:** When rendering sprites, floating-point coordinates must be rounded or floored to prevent sub-pixel blurring.
*   **No Smooth Gradients:** Use hand-placed dithering (checkerboard or Bayer patterns) for shading to maintain the raw, degraded aesthetic.

## Example: The Serum Bot
*   *Bad:* A grey circle with a red dot.
*   *Good:* A rusted cubic chassis, visible distinct treads, an asymmetrical injector arm, and a lens that reflects a non-existent sky.
