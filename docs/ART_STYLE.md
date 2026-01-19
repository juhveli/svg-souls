# ART STYLE GUIDE: The Rusty Bit

## Core Philosophy
**"The 16-bit Zelda aesthetic, but the cartridge was left in the rain for a decade."**

We are emulating the limitations and techniques of the SNES/GBA era (specifically *Link to the Past* and *Minish Cap*) but applying them to a *Dark Souls* / *Bloodborne* cosmology.

## The 4 Pillars

### 1. Perspective & Projection
*   **3/4 Top-Down:** Objects should show the "Front" and "Top" planes.
*   **Grid Alignment:** All assets are drawn on a virtual 32x32 or 64x64 pixel grid.
*   **No Rotation:** Sprites do not rotate freely. They flip on the X-axis or have distinct directional frames. *Note: For this project, we currently simulate direction via SVG transforms, but the base asset must look correct when static.*

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

### 4. Implementation (SVG as Pixels)
*   **Integer Coordinates Only:** `x="10.5"` is forbidden. `x="11"` is law.
*   **The "Pixel" Path:** Instead of thousands of `<rect>` elements, combine adjacent pixels of the same color into a single `<path d="M..."/>`.
*   **No Gradients:** Use "dithering" (checkerboard patterns) if a gradient is absolutely necessary.

## Example: The Serum Bot
*   *Bad:* A grey circle with a red dot.
*   *Good:* A rusted cubic chassis, visible distinct treads, an asymmetrical injector arm, and a lens that reflects a non-existent sky.
