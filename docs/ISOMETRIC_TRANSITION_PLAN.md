# Isometric Engine & Graphics Transition Plan

## Overview
This document outlines the architectural pivot and artistic transition required to move the game from a procedural SVG/WebGPU hybrid to a modern, dark, and simple 2D isometric pixel-art style. The target aesthetic is heavily inspired by `unnamed.jpg` found in the root repository.

The goal is to emulate a "16-bit Zelda aesthetic, but the cartridge was left in the rain for a decade," applied to a *Dark Souls* / *Bloodborne* cosmology, but shifted to an isometric projection for greater depth and architectural scale.

## The Vision & Aesthetic
*   **Perspective:** Isometric (2.5D). World objects are aligned to a diamond grid (typically 2:1 ratio, e.g., 64x32 tiles).
*   **Palette:** Darker, muted, and heavily oxidized. Primary colors are avoided. We rely on Rust, Verdigris, Void (deep blacks), and sharp, corrupted neon accents (Soul/Resonance).
*   **Form:** Simple, chunky, and readable pixel art. High contrast is essential since light sources are dim.
*   **Lore Connection:** The visual decay must reflect the narrative. Everything is broken clockwork, silent ecosystems of glass, or rusted scrapyards. Assets should look heavy, grounded, and "scheduled for disposal."

## Asset Sourcing & Integration Strategy
To rapidly prototype and build out the world, we will leverage high-quality, free open-source assets (CC0 or CC-BY) that fit the "dark fantasy" or "industrial decay" aesthetic.

### 1. Sourcing Platforms
*   [OpenGameArt.org](https://opengameart.org) (Search: "isometric", "dark fantasy", "ruins", "pixel art")
*   [Itch.io](https://itch.io) (Game Assets -> Free -> Isometric)
*   [Kenney.nl](https://kenney.nl) (For structural placeholders, though textures will need gritty modification).

### 2. Vetting Process
*   **License Check:** Assets *must* be CC0 (Public Domain) or CC-BY (Attribution required). For CC-BY, ensure the creator is added to `docs/CREDITS.md` immediately upon download.
*   **Style Match:** Does it fit a 2:1 isometric grid? Is the lighting direction consistent (usually top-left or top-down)?
*   **Color Palette Adaptation:** Downloaded assets will almost always need a palette swap or "grime pass." We will build a Python script (extending `tools/asset_pipeline/blight_filter.py`) to automatically map bright open-source colors to our Rust/Verdigris palette and inject noise (decay).

### 3. File Organization
*   Place new raw assets in `assets/sprites/raw/`.
*   Processed, game-ready assets go into `assets/sprites/isometric/`.
*   Maintain a JSON index or sprite atlas definition file for the WebGPU renderer to consume.

## Technical Architecture Pivot (The Engine Rewrite)
The current engine relies on drawing SVG nodes to the DOM and rendering SDFs (Signed Distance Fields) via WebGPU. This is fundamentally incompatible with performant, tile-based 2D isometric rendering.

We must pivot to a **Texture-Based Sprite Batching** approach in WebGPU (or fallback to a highly optimized `CanvasRenderingContext2D` if WebGPU complexity stalls development).

### 1. Isometric Coordinate Math
We need a robust utility to convert between Screen Space (pixels on the monitor) and World Space (isometric grid coordinates).

**Standard 2:1 Isometric Formula:**
```typescript
// World (Cartesian) to Screen (Isometric)
screenX = (worldX - worldY) * (tileWidth / 2);
screenY = (worldX + worldY) * (tileHeight / 2) - worldZ;

// Screen (Isometric) to World (Cartesian) - Ignoring Z for flat picking
worldX = (screenX / (tileWidth / 2) + screenY / (tileHeight / 2)) / 2;
worldY = (screenY / (tileHeight / 2) - screenX / (tileWidth / 2)) / 2;
```

### 2. Depth Sorting (Z-Indexing)
In isometric projection, objects must be drawn from back to front to overlap correctly.
*   The standard sort order is based on the bottom-most Y-coordinate of the sprite on the screen (or `worldX + worldY + worldZ`).
*   The renderer must collect all visible sprites, sort them by depth every frame, and then batch them for drawing.

### 3. WebGPU Sprite Renderer (The Goal)
*   Load sprite sheets (atlases) as `GPUTexture`.
*   Create a vertex buffer containing position (Screen X, Y), size, UV coordinates, and depth.
*   Write a simple WGSL shader that samples the texture based on UVs and discards transparent pixels.

## Phased Implementation Roadmap

### Phase 1: The Core Math & Placeholder Render
*   [ ] Implement `src/engine/IsometricMath.ts`.
*   [ ] Replace `GameMap.ts` SVG generation with a simple `OffscreenCanvas` or basic WebGPU quad renderer drawing a flat grid of isometric placeholder tiles.
*   [ ] Verify coordinate conversions by allowing the player to click a tile and highlight it.

### Phase 2: Asset Pipeline Adaptation
*   [ ] Download a set of CC0 isometric ruin/dungeon tiles.
*   [ ] Update `tools/asset_pipeline` to load PNGs, apply the "Blight Filter" (recolor to rust/void), and output standard tile sizes.
*   [ ] Create a basic level editor or `Tiled` map loader to construct `Zone 0: The Scrapyard` using these assets.

### Phase 3: Entity Integration & Sorting
*   [ ] Convert player and enemy rendering logic to use isometric sprite frames instead of SDFs/SVGs.
*   [ ] Implement the depth-sorting algorithm in the render loop. Ensure entities render correctly *behind* tall walls and *in front* of floor tiles.

### Phase 4: Lighting & Polish
*   [ ] Re-implement dynamic lighting. Since we are no longer using SDF normals, we can use a simpler 2D lightmap approach or basic radial blending over the isometric view.
*   [ ] Ensure `unnamed.jpg`'s level of dark atmospheric fog and shadow is achieved.

## Lore Translation Guidelines
When adapting or creating assets, follow these canonical rules:

*   **Serum Bots (Security):** Should look like heavy, rusted, cubic industrial machinery. Not sleek robots.
*   **The Scrapyard (Zone 0):** Tiles should be cracked concrete, massive rusted gears serving as platforms, and deep pits of smog.
*   **Glass Gardens (Zone 1):** Tiles should be sharp, translucent (if possible), or jagged crystalline structures erupting from ancient stone.
*   **Items (e.g., Glass Shard, Stopped Watch):** Inventory icons should remain high-contrast pixel art, but the "dropped" world model should be a distinct, readable isometric sprite casting a small shadow.

## PNG Asset Integration Process
Refer to `docs/ASSET_PIPELINE_PNG.md` for full instructions on how to download, extract, and process CC0/CC-BY isometric pixel art using `tools/asset_pipeline/process_isometric_assets.py`. The tool enforces the dark Rust/Void aesthetic, grid compliance, and decay mapping.
